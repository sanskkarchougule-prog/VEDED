"""Stripe payments via emergentintegrations (Flow B, using STRIPE_API_KEY)."""
import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

from auth import get_current_user_id
from plans import VEDED_PLANS, BOOKSTREAM_PLANS, TOPUP_PACKS, ALL_PACKAGES

router = APIRouter(prefix="/api", tags=["payments"])


class CheckoutReq(BaseModel):
    package_id: str
    origin_url: str


def _apply_purchase(user_doc: dict, package_id: str) -> dict:
    """Return $inc + $set dict for wallet + tier updates."""
    updates = {"$set": {}, "$inc": {}}
    if package_id in VEDED_PLANS:
        plan = VEDED_PLANS[package_id]
        updates["$set"]["veded_tier"] = package_id
        c = plan.get("credits", {})
        updates["$inc"]["wallet.image_credits"] = c.get("image", 0)
        updates["$inc"]["wallet.video_credits"] = c.get("video", 0)
        updates["$inc"]["wallet.audio_chars"] = c.get("audio_chars", 0)
        updates["$inc"]["wallet.dubbing_credits"] = c.get("dubbing", 0)
    elif package_id in BOOKSTREAM_PLANS:
        plan = BOOKSTREAM_PLANS[package_id]
        updates["$set"]["bookstream_tier"] = package_id
        c = plan.get("credits", {})
        updates["$inc"]["wallet.dubbing_credits"] = c.get("dubbing", 0)
    elif package_id in TOPUP_PACKS:
        pack = TOPUP_PACKS[package_id]
        if "cash_credit" in pack:
            updates["$inc"]["wallet.cash_balance"] = pack["cash_credit"]
        if "image" in pack:
            updates["$inc"]["wallet.image_credits"] = pack["image"]
        if "video" in pack:
            updates["$inc"]["wallet.video_credits"] = pack["video"]
        if "dubbing" in pack:
            updates["$inc"]["wallet.dubbing_credits"] = pack["dubbing"]
    if not updates["$set"]:
        updates.pop("$set")
    if not updates["$inc"]:
        updates.pop("$inc")
    return updates


def build_router(db):
    @router.get("/plans")
    async def get_plans():
        from plans import FEATURE_GROUPS
        return {
            "veded": list(VEDED_PLANS.values()),
            "bookstream": list(BOOKSTREAM_PLANS.values()),
            "topups": list(TOPUP_PACKS.values()),
            "feature_groups": FEATURE_GROUPS,
        }

    @router.post("/payments/checkout")
    async def create_checkout(payload: CheckoutReq, request: Request, user_id: str = Depends(get_current_user_id)):
        pkg = ALL_PACKAGES.get(payload.package_id)
        if not pkg:
            raise HTTPException(400, f"Unknown package: {payload.package_id}")
        if pkg.get("price_usd", 0) <= 0:
            raise HTTPException(400, "Cannot checkout a free package")

        from emergentintegrations.payments.stripe.checkout import (
            StripeCheckout, CheckoutSessionRequest,
        )
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
        checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)

        origin = payload.origin_url.rstrip("/")
        success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/payment/cancel"

        amount = float(pkg["price_usd"])
        req = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user_id,
                "package_id": payload.package_id,
                "package_name": pkg.get("name", ""),
            },
        )
        session = await checkout.create_checkout_session(req)

        await db.payment_transactions.insert_one({
            "session_id": session.session_id,
            "user_id": user_id,
            "package_id": payload.package_id,
            "amount": amount,
            "currency": "usd",
            "status": "initiated",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"checkout_url": session.url, "session_id": session.session_id}

    @router.get("/payments/status/{session_id}")
    async def payment_status(session_id: str):
        record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if not record:
            raise HTTPException(404, "Transaction not found")
        if record.get("payment_status") != "paid":
            # Poll Stripe directly
            try:
                from emergentintegrations.payments.stripe.checkout import StripeCheckout
                stripe_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
                checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
                status_obj = await checkout.get_checkout_status(session_id)
                if status_obj.payment_status == "paid" or status_obj.status == "complete":
                    # Idempotent update
                    result = await db.payment_transactions.update_one(
                        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                        {"$set": {"status": "completed", "payment_status": "paid",
                                  "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    if result.modified_count > 0:
                        # Grant credits
                        u = await db.users.find_one({"id": record["user_id"]})
                        if u:
                            upd = _apply_purchase(u, record["package_id"])
                            if upd:
                                await db.users.update_one({"id": record["user_id"]}, upd)
                    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            except Exception as e:
                print(f"[payments] poll error: {e}")
        return {
            "session_id": record["session_id"],
            "status": record["status"],
            "payment_status": record["payment_status"],
            "package_id": record.get("package_id"),
        }

    @router.post("/webhook/stripe")
    async def stripe_webhook(request: Request):
        try:
            from emergentintegrations.payments.stripe.checkout import StripeCheckout
            stripe_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
            checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
            body = await request.body()
            signature = request.headers.get("Stripe-Signature", "")
            webhook_response = await checkout.handle_webhook(body, signature)
            if webhook_response.payment_status == "paid":
                record = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
                if record and record.get("payment_status") != "paid":
                    await db.payment_transactions.update_one(
                        {"session_id": webhook_response.session_id, "payment_status": {"$ne": "paid"}},
                        {"$set": {"status": "completed", "payment_status": "paid",
                                  "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    u = await db.users.find_one({"id": record["user_id"]})
                    if u:
                        upd = _apply_purchase(u, record["package_id"])
                        if upd:
                            await db.users.update_one({"id": record["user_id"]}, upd)
            return {"ok": True}
        except Exception as e:
            print(f"[webhook] error: {e}")
            return {"ok": False, "error": str(e)}

    return router
