"""Auth routes: signup, login, me."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional

from auth import (
    hash_password, verify_password, create_token,
    get_current_user_id, new_id, default_wallet,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupReq(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None


class LoginReq(BaseModel):
    email: EmailStr
    password: str


def _public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name") or u["email"].split("@")[0],
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

    return router
