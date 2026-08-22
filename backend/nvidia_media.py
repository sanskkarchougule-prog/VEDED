"""Real AI media generation using the user's NVIDIA keys.
- Images: FLUX.1-dev / FLUX.1-schnell (NVIDIA hosted GenAI).
- Video/movies/shorts/web-series: FLUX keyframe animated into an MP4 (Ken-Burns) via ffmpeg,
  because NVIDIA Wan 2.2 video is GPU-download-only (no hosted API).
All keys are read from env, server-side only.
"""
import os
import base64
import uuid
import asyncio
import subprocess
import logging
from pathlib import Path

import httpx
import imageio_ffmpeg

logger = logging.getLogger("veded.media")

GENAI_BASE = "https://ai.api.nvidia.com/v1/genai"
MEDIA_DIR = Path(__file__).parent / "generated_media"
MEDIA_DIR.mkdir(exist_ok=True)

FLUX_MODELS = {
    "flux-dev": {"slug": "black-forest-labs/flux.1-dev", "key_env": "NVIDIA_FLUX_DEV_KEY", "steps": 30},
    "flux-schnell": {"slug": "black-forest-labs/flux.1-schnell", "key_env": "NVIDIA_FLUX_SCHNELL_KEY", "steps": 4},
}

ASPECT = {
    "1:1": (1024, 1024),
    "16:9": (1344, 768),
    "9:16": (768, 1344),
    "21:9": (1344, 768),
    "4:3": (1024, 768),
    "3:4": (768, 1024),
}


def _flux_size(aspect: str):
    return ASPECT.get(aspect or "1:1", (1024, 1024))


def _cleanup_old_media(max_age_hours: int = 6):
    """Delete generated media older than max_age_hours to bound disk usage."""
    import time
    cutoff = time.time() - max_age_hours * 3600
    try:
        for f in MEDIA_DIR.iterdir():
            if f.is_file() and f.stat().st_mtime < cutoff:
                f.unlink(missing_ok=True)
    except Exception as e:
        logger.warning("media cleanup failed: %s", e)


async def generate_flux_image_b64(prompt: str, style: str = None, aspect: str = "1:1",
                                  model: str = "flux-dev") -> str | None:
    """Return raw base64 JPEG (no data: prefix) or None."""
    cfg = FLUX_MODELS.get(model) or FLUX_MODELS["flux-dev"]
    api_key = os.environ.get(cfg["key_env"]) or os.environ.get("NVIDIA_FLUX_DEV_KEY")
    if not api_key:
        return None
    w, h = _flux_size(aspect)
    full_prompt = f"{style}, {prompt}" if style else prompt
    payload = {"prompt": full_prompt[:1500], "mode": "base", "cfg_scale": 3.5,
               "width": w, "height": h, "steps": cfg["steps"], "seed": 0}
    url = f"{GENAI_BASE}/{cfg['slug']}"
    headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json",
               "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code != 200:
            logger.error("FLUX %s error %s: %s", model, resp.status_code, resp.text[:200])
            return None
        data = resp.json()
        arts = data.get("artifacts") or []
        if arts and arts[0].get("base64"):
            return arts[0]["base64"]
    except Exception as e:
        logger.error("FLUX request failed: %s", e)
    return None


def _run_ffmpeg(image_path: Path, out_path: Path, seconds: int, portrait: bool):
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    w, h = (720, 1280) if portrait else (1280, 720)
    fps = 25
    frames = seconds * fps
    # Slow Ken-Burns zoom for lifelike motion from a still keyframe.
    vf = (
        f"scale={w*2}:{h*2},"
        f"zoompan=z='min(zoom+0.0012,1.18)':d={frames}:s={w}x{h}:fps={fps},"
        f"format=yuv420p"
    )
    cmd = [ff, "-y", "-loop", "1", "-i", str(image_path), "-t", str(seconds),
           "-vf", vf, "-r", str(fps), "-c:v", "libx264", "-preset", "veryfast",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out_path)]
    proc = subprocess.run(cmd, capture_output=True, timeout=120)
    if proc.returncode != 0:
        logger.error("ffmpeg failed: %s", proc.stderr.decode()[-400:])
        raise RuntimeError("ffmpeg encode failed")


async def generate_video_from_prompt(prompt: str, style: str = None, aspect: str = "16:9",
                                     seconds: int = 5) -> str | None:
    """Generate a FLUX keyframe and animate it into an MP4. Returns relative media path or None."""
    _cleanup_old_media()
    b64 = await generate_flux_image_b64(prompt, style, aspect, model="flux-dev")
    if not b64:
        return None
    mid = uuid.uuid4().hex
    img_path = MEDIA_DIR / f"{mid}.jpg"
    out_path = MEDIA_DIR / f"{mid}.mp4"
    img_path.write_bytes(base64.b64decode(b64))
    portrait = aspect in ("9:16", "3:4")
    try:
        await asyncio.to_thread(_run_ffmpeg, img_path, out_path, seconds, portrait)
    except Exception:
        return None
    finally:
        try:
            img_path.unlink(missing_ok=True)
        except Exception:
            pass
    if out_path.exists():
        return f"{mid}.mp4"
    return None
