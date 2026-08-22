"""VEDED creation studio endpoints — real image gen via Gemini Nano Banana, others mocked."""
import os
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from auth import get_current_user_id, new_id
from plans import GENERATION_COST

router = APIRouter(prefix="/api/veded", tags=["veded"])


class GenerateReq(BaseModel):
    kind: str = Field(pattern="^(image|video|audio|movie)$")
    prompt: str = Field(min_length=1, max_length=2000)
    style: Optional[str] = None
    model: Optional[str] = None
    aspect_ratio: Optional[str] = "16:9"
    duration: Optional[int] = 5
    voice: Optional[str] = None
    options: Optional[dict] = None
    model_config = {"extra": "ignore"}


PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1024",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1024",
    "https://images.unsplash.com/photo-1614850523011-8f49ffc73908?w=1024",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1024",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1024",
    "https://images.unsplash.com/photo-1478720568477-b0829d60d9f6?w=1024",
]

PLACEHOLDER_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
]

PLACEHOLDER_AUDIO = [
    "https://cdn.pixabay.com/audio/2022/10/25/audio_69a61cd719.mp3",
    "https://cdn.pixabay.com/audio/2023/06/13/audio_5fb0c1d3d3.mp3",
]


async def _generate_image_via_nano_banana(prompt: str, style: Optional[str] = None) -> Optional[str]:
    """Real image generation using Gemini Nano Banana (gemini-3.1-flash-image-preview)."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        key = os.environ.get("EMERGENT_LLM_KEY")
        if not key:
            print("[veded] No EMERGENT_LLM_KEY")
            return None
        chat = LlmChat(
            api_key=key,
            session_id=f"veded-img-{uuid.uuid4()}",
            system_message="You are a VEDED image generation engine. Render cinematic, high-fidelity images from prompts.",
        )
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        style_prefix = f"{style}, " if style else ""
        msg = UserMessage(text=f"{style_prefix}{prompt}")
        _text, images = await chat.send_message_multimodal_response(msg)
        if images and len(images) > 0:
            img = images[0]
            mime = img.get("mime_type", "image/png")
            return f"data:{mime};base64,{img['data']}"
    except Exception as e:
        print(f"[veded] Nano Banana failed: {type(e).__name__}: {str(e)[:200]}")
    return None


async def _generate_audio_via_sarvam(text: str, language: str = "hi-IN", speaker: str = "anushka") -> Optional[str]:
    """Try Sarvam AI TTS. Returns data URL or None."""
    try:
        import httpx
        keys = [os.environ.get("SARVAM_API_KEY_1"), os.environ.get("SARVAM_API_KEY_2")]
        keys = [k for k in keys if k]
        if not keys:
            return None
        for key in keys:
            try:
                async with httpx.AsyncClient(timeout=45) as client:
                    resp = await client.post(
                        "https://api.sarvam.ai/text-to-speech",
                        headers={"api-subscription-key": key, "Content-Type": "application/json"},
                        json={
                            "inputs": [text[:500]],
                            "target_language_code": language,
                            "speaker": speaker,
                            "pitch": 0,
                            "pace": 1.0,
                            "loudness": 1.0,
                            "speech_sample_rate": 22050,
                            "enable_preprocessing": True,
                            "model": "bulbul:v2",
                        },
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        audios = data.get("audios") or []
                        if audios:
                            b64 = audios[0]
                            return f"data:audio/wav;base64,{b64}"
                    else:
                        print(f"[veded] Sarvam TTS {resp.status_code}: {resp.text[:200]}")
            except Exception as inner:
                print(f"[veded] Sarvam attempt failed: {inner}")
    except Exception as e:
        print(f"[veded] Sarvam integration failed: {e}")
    return None


def _pick_placeholder(items: list, prompt: str) -> str:
    idx = abs(hash(prompt)) % len(items)
    return items[idx]


def build_router(db):
    @router.post("/generate")
    async def generate(payload: GenerateReq, user_id: str = Depends(get_current_user_id)):
        u = await db.users.find_one({"id": user_id})
        if not u:
            raise HTTPException(404, "User not found")
        wallet = u.get("wallet", {})
        cost_map = GENERATION_COST[payload.kind if payload.kind != "movie" else "video"]
        field = cost_map["credit_field"]
        need = cost_map["amount"]
        if payload.kind == "audio":
            need = max(len(payload.prompt), 500)
        if payload.kind == "movie":
            need = 5
        current = wallet.get(field, 0)
        if current < need:
            raise HTTPException(402, f"Insufficient {field}. Need {need}, have {current}.")

        cid = new_id()
        creation = {
            "id": cid,
            "user_id": user_id,
            "type": payload.kind,
            "prompt": payload.prompt,
            "style": payload.style,
            "model": payload.model,
            "aspect_ratio": payload.aspect_ratio,
            "options": payload.options or {},
            "status": "processing",
            "output_url": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.creations.insert_one(creation)

        output_url = None
        generator_used = "placeholder"

        if payload.kind == "image":
            output_url = await _generate_image_via_nano_banana(payload.prompt, payload.style)
            if output_url:
                generator_used = "gemini-nano-banana"
            else:
                output_url = _pick_placeholder(PLACEHOLDER_IMAGES, payload.prompt)
        elif payload.kind == "audio":
            # Language + speaker from options / voice payload
            opts = payload.options or {}
            lang = opts.get("language") or payload.voice or "hi-IN"
            speaker = opts.get("speaker") or "anushka"
            output_url = await _generate_audio_via_sarvam(payload.prompt, lang, speaker)
            if output_url:
                generator_used = "sarvam-bulbul"
            else:
                output_url = _pick_placeholder(PLACEHOLDER_AUDIO, payload.prompt)
        elif payload.kind == "video":
            output_url = _pick_placeholder(PLACEHOLDER_VIDEOS, payload.prompt)
        elif payload.kind == "movie":
            output_url = _pick_placeholder(PLACEHOLDER_VIDEOS, payload.prompt)

        await db.creations.update_one(
            {"id": cid},
            {"$set": {
                "status": "completed",
                "output_url": output_url,
                "generator_used": generator_used,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {f"wallet.{field}": -need}}
        )

        u2 = await db.users.find_one({"id": user_id})
        creation_out = {k: v for k, v in creation.items() if k != "_id"}
        creation_out["status"] = "completed"
        creation_out["output_url"] = output_url
        creation_out["generator_used"] = generator_used
        return {"creation": creation_out, "wallet": u2.get("wallet", {})}

    @router.get("/creations")
    async def list_creations(user_id: str = Depends(get_current_user_id), limit: int = 50):
        cur = db.creations.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(limit)
        items = await cur.to_list(limit)
        return {"items": items}

    @router.delete("/creations/{cid}")
    async def delete_creation(cid: str, user_id: str = Depends(get_current_user_id)):
        res = await db.creations.delete_one({"id": cid, "user_id": user_id})
        return {"deleted": res.deleted_count}

    return router
