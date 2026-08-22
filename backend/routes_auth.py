"""Auth routes: signup, login, me, google session."""
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional

from auth import (
    hash_password, verify_password, create_token,
    get_current_user_id, new_id, default_wallet,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Emergent-managed Google auth: backend exchanges the one-time session_id for user data.
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


class SignupReq(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionReq(BaseModel):
    session_id: str


def _public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name") or u["email"].split("@")[0],
        "picture": u.get("picture"),
        "veded_tier": u.get("veded_tier", "free"),
        "bookstream_tier": u.get("bookstream_tier"),
        "wallet": u.get("wallet", default_wallet()),
        "trial_used": u.get("trial_used", False),
        "created_at": u.get("created_at"),
    }


def build_router(db):
    @router.post("/signup")
    async def signup(payload: SignupReq):
        existing = await db.users.find_one({"email": payload.email.lower()})
        if existing:
            raise HTTPException(409, "Email already registered")
        user_id = new_id()
        doc = {
            "id": user_id,
            "email": payload.email.lower(),
            "name": payload.name or payload.email.split("@")[0],
            "password_hash": hash_password(payload.password),
            "veded_tier": "free",
            "bookstream_tier": None,
            "wallet": default_wallet(),
            "trial_used": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(doc)
        token = create_token(user_id)
        return {"token": token, "user": _public_user(doc)}

    @router.post("/login")
    async def login(payload: LoginReq):
        u = await db.users.find_one({"email": payload.email.lower()})
        if not u or not verify_password(payload.password, u["password_hash"]):
            raise HTTPException(401, "Invalid credentials")
        token = create_token(u["id"])
        return {"token": token, "user": _public_user(u)}

    @router.get("/me")
    async def me(user_id: str = Depends(get_current_user_id)):
        u = await db.users.find_one({"id": user_id})
        if not u:
            raise HTTPException(404, "User not found")
        return {"user": _public_user(u)}

    @router.post("/google/session")
    async def google_session(payload: GoogleSessionReq):
        # Exchange the one-time Emergent session_id for verified Google profile (server-side only).
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    EMERGENT_SESSION_URL,
                    headers={"X-Session-ID": payload.session_id},
                )
        except httpx.HTTPError:
            raise HTTPException(502, "Could not reach Google auth service")
        if resp.status_code != 200:
            raise HTTPException(401, "Invalid or expired Google session")
        data = resp.json()
        email = (data.get("email") or "").lower()
        if not email:
            raise HTTPException(401, "Google session returned no email")

        u = await db.users.find_one({"email": email})
        if not u:
            user_id = new_id()
            u = {
                "id": user_id,
                "email": email,
                "name": data.get("name") or email.split("@")[0],
                "picture": data.get("picture"),
                "auth_provider": "google",
                "veded_tier": "free",
                "bookstream_tier": None,
                "wallet": default_wallet(),
                "trial_used": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.users.insert_one(u)
        else:
            # Link/refresh Google profile fields on the existing account.
            updates = {}
            if data.get("picture") and not u.get("picture"):
                updates["picture"] = data["picture"]
            if data.get("name") and not u.get("name"):
                updates["name"] = data["name"]
            if updates:
                await db.users.update_one({"id": u["id"]}, {"$set": updates})
                u.update(updates)

        token = create_token(u["id"])
        return {"token": token, "user": _public_user(u)}

    return router
