"""BookStream endpoints: content browse, detail, dubbing, free trial."""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from auth import get_current_user_id, new_id
from plans import BOOKSTREAM_CONTENT, DUBBING_LANGUAGES, GENERATION_COST

router = APIRouter(prefix="/api/bookstream", tags=["bookstream"])


class DubReq(BaseModel):
    content_id: str
    language: str


class TrialReq(BaseModel):
    content_id: str
    device_fingerprint: str


PLACEHOLDER_DUB_AUDIO: List[str] = [
    "https://cdn.pixabay.com/audio/2022/10/25/audio_69a61cd719.mp3",
    "https://cdn.pixabay.com/audio/2023/06/13/audio_5fb0c1d3d3.mp3",
]


def build_router(db) -> APIRouter:
    @router.get("/content")
    async def list_content(type: Optional[str] = None) -> Dict[str, Any]:
        items = BOOKSTREAM_CONTENT
        if type:
            items = [c for c in items if c["type"] == type]
        return {"items": items}

    @router.get("/content/{cid}")
    async def get_content(cid: str) -> Dict[str, Any]:
        for c in BOOKSTREAM_CONTENT:
            if c["id"] == cid:
                return c
        raise HTTPException(404, "Content not found")

    @router.get("/languages")
    async def list_languages() -> Dict[str, Any]:
        return {"items": DUBBING_LANGUAGES}

    @router.post("/dub")
    async def dub_content(payload: DubReq, user_id: str = Depends(get_current_user_id)) -> Dict[str, Any]:
        u = await db.users.find_one({"id": user_id})
        if not u:
            raise HTTPException(404, "User not found")
        # Check content
        content = next((c for c in BOOKSTREAM_CONTENT if c["id"] == payload.content_id), None)
        if not content:
            raise HTTPException(404, "Content not found")
        # Language
        lang = next((l for l in DUBBING_LANGUAGES if l["code"] == payload.language), None)
        if not lang:
            raise HTTPException(400, "Unsupported language")
        # Credit
        wallet = u.get("wallet", {})
        need = GENERATION_COST["dubbing"]["amount"]
        if wallet.get("dubbing_credits", 0) < need:
            raise HTTPException(402, f"Insufficient dubbing credits. Need {need}.")

        track_id = new_id()
        track = {
            "id": track_id,
            "content_id": payload.content_id,
            "user_id": user_id,
            "language": payload.language,
            "language_name": lang["name"],
            "dubbed_audio_url": PLACEHOLDER_DUB_AUDIO[abs(hash(payload.content_id + payload.language)) % len(PLACEHOLDER_DUB_AUDIO)],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.dubbed_tracks.insert_one(track)
        await db.users.update_one({"id": user_id}, {"$inc": {"wallet.dubbing_credits": -need}})

        u2 = await db.users.find_one({"id": user_id})
        track_out = {k: v for k, v in track.items() if k != "_id"}
        return {"track": track_out, "wallet": u2.get("wallet", {})}

    @router.get("/my-dubs")
    async def my_dubs(user_id: str = Depends(get_current_user_id)) -> Dict[str, Any]:
        cur = db.dubbed_tracks.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
        items = await cur.to_list(200)
        return {"items": items}

    @router.post("/trial")
    async def use_trial(payload: TrialReq, user_id: str = Depends(get_current_user_id)) -> Dict[str, Any]:
        u = await db.users.find_one({"id": user_id})
        if not u:
            raise HTTPException(404, "User not found")
        if u.get("trial_used"):
            raise HTTPException(403, "Trial already used for this account")
        # Check device fingerprint isn't used elsewhere
        conflict = await db.users.find_one({
            "device_fingerprint": payload.device_fingerprint,
            "id": {"$ne": user_id},
            "trial_used": True,
        })
        if conflict:
            raise HTTPException(403, "Trial already used from this device")
        content = next((c for c in BOOKSTREAM_CONTENT if c["id"] == payload.content_id), None)
        if not content:
            raise HTTPException(404, "Content not found")
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"trial_used": True, "device_fingerprint": payload.device_fingerprint,
                      "trial_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"granted": True, "content": content, "preview_seconds": 180}

    return router
