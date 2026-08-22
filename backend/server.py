import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import base64
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import qrcode
from io import BytesIO
from urllib.parse import quote
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr

import ai_client

# ---------------------------------------------------------------- setup
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
PROFIT_MARGIN = float(os.environ.get('PROFIT_MARGIN', '0.40'))
UPI_PAYEE = os.environ.get('UPI_PAYEE', '')
UPI_PAYEE_DISPLAY = os.environ.get('UPI_PAYEE_DISPLAY', 'VEDED')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("veded")

app = FastAPI(title="VEDED API")
api = APIRouter(prefix="/api")

# ---------------------------------------------------------------- pricing config
# price = INR/month. Server keeps PROFIT_MARGIN as profit; cost basis = price*(1-margin).
PLANS = [
    {"id": "free",    "name": "Free",    "price": 0,   "credits": 60,   "popular": False,
     "features": ["60 starter credits", "FLUX image generation", "Standard resolution", "Community feed access"]},
    {"id": "starter", "name": "Starter", "price": 199, "credits": 600,  "popular": False,
     "features": ["600 credits / month", "All image models", "HD resolution", "Priority queue", "Publish to Discover"]},
    {"id": "pro",     "name": "Pro",     "price": 499, "credits": 1800, "popular": True,
     "features": ["1,800 credits / month", "All models + upcoming video", "4K upscale ready", "Fastest queue", "Creator earnings 40%", "Bookstream uploads"]},
    {"id": "studio",  "name": "Studio",  "price": 999, "credits": 4200, "popular": False,
     "features": ["4,200 credits / month", "Everything in Pro", "Commercial license", "Early access to new models", "Dedicated support"]},
]
CREDIT_PACKS = [
    {"id": "pack_s", "credits": 300,  "price": 99},
    {"id": "pack_m", "credits": 800,  "price": 249},
    {"id": "pack_l", "credits": 2000, "price": 499},
]

def plan_by_id(pid):
    return next((p for p in PLANS if p["id"] == pid), None)
def pack_by_id(pid):
    return next((p for p in CREDIT_PACKS if p["id"] == pid), None)

# ---------------------------------------------------------------- models
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ImageGenIn(BaseModel):
    prompt: str
    model: str = "flux-dev"
    width: int = 1024
    height: int = 1024
    negative_prompt: str = ""
    publish: bool = False

class ChatIn(BaseModel):
    message: str

class PaymentInitIn(BaseModel):
    kind: str            # "plan" or "pack"
    item_id: str

class PaymentSubmitIn(BaseModel):
    payment_id: str
    utr: str

class PublishIn(BaseModel):
    media_id: str
    title: str
    category: str = "AI Art"

# ---------------------------------------------------------------- auth helpers
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def public_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "name": u.get("name", ""),
        "email": u["email"],
        "role": u.get("role", "user"),
        "credits": u.get("credits", 0),
        "plan": u.get("plan", "free"),
        "created_at": u.get("created_at"),
    }

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# ---------------------------------------------------------------- auth routes
@api.post("/auth/register")
async def register(body: RegisterIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "name": body.name.strip() or email.split("@")[0],
        "email": email,
        "password_hash": hash_password(body.password),
        "role": "user",
        "credits": 60,
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    token = create_token(str(res.inserted_id), email)
    return {"token": token, "user": public_user(doc)}

@api.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(str(user["_id"]), email)
    return {"token": token, "user": public_user(user)}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)

# ---------------------------------------------------------------- config / pricing
@api.get("/config")
async def config():
    return {
        "app_name": "VEDED",
        "image_models": [
            {"id": k, "label": v["label"], "credits": v["credits"]}
            for k, v in ai_client.IMAGE_MODELS.items()
        ],
        "plans": PLANS,
        "credit_packs": CREDIT_PACKS,
        "profit_margin": PROFIT_MARGIN,
        "razorpay_enabled": bool(os.environ.get("RAZORPAY_KEY_ID")),
    }

@api.get("/pricing")
async def pricing():
    plans = []
    for p in PLANS:
        cost = round(p["price"] * (1 - PROFIT_MARGIN))
        plans.append({**p, "cost_basis": cost, "profit": p["price"] - cost})
    return {"plans": plans, "credit_packs": CREDIT_PACKS, "profit_margin": PROFIT_MARGIN}

# ---------------------------------------------------------------- generation
@api.post("/generate/image")
async def generate_image(body: ImageGenIn, user: dict = Depends(get_current_user)):
    cfg = ai_client.IMAGE_MODELS.get(body.model)
    if not cfg:
        raise HTTPException(status_code=400, detail="Unknown model")
    cost = cfg["credits"]
    if user.get("credits", 0) < cost:
        raise HTTPException(status_code=402, detail="Not enough credits. Please upgrade or top up.")

    seed = secrets.randbelow(1_000_000)
    try:
        b64 = await ai_client.generate_image(
            body.model, body.prompt, width=body.width, height=body.height,
            seed=seed, negative_prompt=body.negative_prompt,
        )
    except ai_client.AIError as e:
        raise HTTPException(status_code=502, detail=str(e))

    media_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.media.insert_one({
        "_id": media_id, "owner_id": str(user["_id"]), "owner_name": user.get("name"),
        "type": "image", "prompt": body.prompt, "model": body.model,
        "b64": b64, "width": body.width, "height": body.height,
        "published": bool(body.publish), "title": body.prompt[:60],
        "category": "AI Art", "created_at": now,
    })
    new_credits = user["credits"] - cost
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"credits": new_credits}})
    return {"id": media_id, "url": f"/api/media/{media_id}", "credits": new_credits, "cost": cost}

@api.get("/media/{media_id}")
async def get_media(media_id: str):
    doc = await db.media.find_one({"_id": media_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    raw = base64.b64decode(doc["b64"])
    return Response(content=raw, media_type="image/jpeg",
                    headers={"Cache-Control": "public, max-age=31536000"})

@api.get("/gallery")
async def gallery(user: dict = Depends(get_current_user)):
    items = await db.media.find(
        {"owner_id": str(user["_id"])}, {"b64": 0}
    ).sort("created_at", -1).to_list(200)
    return [{
        "id": m["_id"], "url": f"/api/media/{m['_id']}", "prompt": m.get("prompt"),
        "model": m.get("model"), "type": m.get("type"), "published": m.get("published", False),
        "created_at": m.get("created_at"), "title": m.get("title"),
    } for m in items]

@api.post("/publish")
async def publish(body: PublishIn, user: dict = Depends(get_current_user)):
    doc = await db.media.find_one({"_id": body.media_id})
    if not doc or doc["owner_id"] != str(user["_id"]):
        raise HTTPException(status_code=404, detail="Not found")
    await db.media.update_one({"_id": body.media_id},
        {"$set": {"published": True, "title": body.title[:80], "category": body.category}})
    return {"ok": True}

@api.get("/discover")
async def discover():
    items = await db.media.find({"published": True}, {"b64": 0}).sort("created_at", -1).to_list(120)
    out = [{
        "id": m["_id"], "url": f"/api/media/{m['_id']}", "title": m.get("title") or m.get("prompt"),
        "category": m.get("category", "AI Art"), "owner_name": m.get("owner_name"),
        "type": m.get("type"), "created_at": m.get("created_at"),
    } for m in items]
    cats = {}
    for it in out:
        cats.setdefault(it["category"], []).append(it)
    return {"items": out, "categories": [{"name": k, "items": v} for k, v in cats.items()]}

@api.post("/generate/video")
async def generate_video(user: dict = Depends(get_current_user)):
    # NVIDIA Wan 2.2 is a downloadable/self-hosted GPU NIM only — no hosted cloud endpoint.
    raise HTTPException(
        status_code=503,
        detail="Video generation (Wan 2.2) requires dedicated GPU capacity and is coming soon. No credits were used.",
    )

@api.post("/chat")
async def chat(body: ChatIn, user: dict = Depends(get_current_user)):
    if user.get("credits", 0) < 1:
        raise HTTPException(status_code=402, detail="Not enough credits.")
    try:
        reply = await ai_client.chat([
            {"role": "system", "content": "You are VEDED's creative assistant. Help users craft vivid prompts for image, video and story generation. Be concise and inspiring."},
            {"role": "user", "content": body.message},
        ])
    except ai_client.AIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    new_credits = user["credits"] - 1
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"credits": new_credits}})
    return {"reply": reply, "credits": new_credits}

# ---------------------------------------------------------------- payments (UPI manual)
def build_upi_qr(amount: int, note: str) -> str:
    uri = (f"upi://pay?pa={UPI_PAYEE}&pn={quote(UPI_PAYEE_DISPLAY)}"
           f"&am={amount}&cu=INR&tn={quote(note)}")
    img = qrcode.make(uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

@api.post("/payments/upi/initiate")
async def upi_initiate(body: PaymentInitIn, user: dict = Depends(get_current_user)):
    if body.kind == "plan":
        item = plan_by_id(body.item_id)
        if not item or item["price"] == 0:
            raise HTTPException(status_code=400, detail="Invalid plan")
        amount, credits, label = item["price"], item["credits"], f"VEDED {item['name']} Plan"
    elif body.kind == "pack":
        item = pack_by_id(body.item_id)
        if not item:
            raise HTTPException(status_code=400, detail="Invalid pack")
        amount, credits, label = item["price"], item["credits"], f"VEDED {item['credits']} Credits"
    else:
        raise HTTPException(status_code=400, detail="Invalid kind")

    pid = str(uuid.uuid4())
    note = f"VEDED-{pid[:8]}"
    await db.payments.insert_one({
        "_id": pid, "user_id": str(user["_id"]), "user_email": user["email"],
        "kind": body.kind, "item_id": body.item_id, "amount": amount, "credits": credits,
        "label": label, "status": "pending", "utr": None, "note": note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"payment_id": pid, "amount": amount, "credits": credits, "label": label,
            "upi_id": UPI_PAYEE, "note": note, "qr": build_upi_qr(amount, note)}

@api.post("/payments/upi/submit")
async def upi_submit(body: PaymentSubmitIn, user: dict = Depends(get_current_user)):
    pay = await db.payments.find_one({"_id": body.payment_id})
    if not pay or pay["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=404, detail="Payment not found")
    if pay["status"] != "pending":
        raise HTTPException(status_code=400, detail="Payment already processed")
    await db.payments.update_one({"_id": body.payment_id},
        {"$set": {"utr": body.utr.strip(), "status": "submitted",
                  "submitted_at": datetime.now(timezone.utc).isoformat()}})
    return {"ok": True, "status": "submitted"}

@api.get("/payments/mine")
async def my_payments(user: dict = Depends(get_current_user)):
    items = await db.payments.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(100)
    return [{k: v for k, v in p.items() if k != "_id"} | {"id": p["_id"]} for p in items]

# ---------------------------------------------------------------- admin
@api.get("/admin/payments")
async def admin_payments(user: dict = Depends(require_admin)):
    items = await db.payments.find({"status": {"$in": ["submitted", "pending"]}}).sort("created_at", -1).to_list(200)
    return [{k: v for k, v in p.items() if k != "_id"} | {"id": p["_id"]} for p in items]

@api.post("/admin/payments/{payment_id}/approve")
async def approve_payment(payment_id: str, user: dict = Depends(require_admin)):
    pay = await db.payments.find_one({"_id": payment_id})
    if not pay:
        raise HTTPException(status_code=404, detail="Not found")
    if pay["status"] == "approved":
        raise HTTPException(status_code=400, detail="Already approved")
    target = await db.users.find_one({"_id": ObjectId(pay["user_id"])})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    update = {"credits": target.get("credits", 0) + pay["credits"]}
    if pay["kind"] == "plan":
        update["plan"] = pay["item_id"]
    await db.users.update_one({"_id": target["_id"]}, {"$set": update})
    await db.payments.update_one({"_id": payment_id},
        {"$set": {"status": "approved", "approved_at": datetime.now(timezone.utc).isoformat()}})
    return {"ok": True}

@api.post("/admin/payments/{payment_id}/reject")
async def reject_payment(payment_id: str, user: dict = Depends(require_admin)):
    await db.payments.update_one({"_id": payment_id}, {"$set": {"status": "rejected"}})
    return {"ok": True}

@api.get("/")
async def root():
    return {"message": "VEDED API online"}

# ---------------------------------------------------------------- startup
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@veded.app").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "name": "VEDED Admin", "email": admin_email,
            "password_hash": hash_password(admin_pw), "role": "admin",
            "credits": 100000, "plan": "studio",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin %s", admin_email)
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_pw), "role": "admin"}})

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()
