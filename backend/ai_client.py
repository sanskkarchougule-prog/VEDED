"""NVIDIA hosted AI clients. All keys read from env; never exposed to the frontend."""
import os
import base64
import asyncio
import httpx

GENAI_BASE = "https://ai.api.nvidia.com/v1/genai"
LLM_BASE = "https://integrate.api.nvidia.com/v1"

# Image model registry: slug + which env key unlocks it.
IMAGE_MODELS = {
    "flux-dev": {
        "label": "FLUX.1 Dev",
        "slug": "black-forest-labs/flux.1-dev",
        "key_env": "NVIDIA_FLUX_DEV_KEY",
        "credits": 6,
        "steps": 30,
    },
    "flux-schnell": {
        "label": "FLUX.1 Schnell (Fast)",
        "slug": "black-forest-labs/flux.1-schnell",
        "key_env": "NVIDIA_FLUX_SCHNELL_KEY",
        "credits": 3,
        "steps": 4,
    },
}


class AIError(Exception):
    pass


async def generate_image(model_id: str, prompt: str, width: int = 1024, height: int = 1024,
                         seed: int = 0, negative_prompt: str = "") -> str:
    """Returns a base64 JPEG string. Raises AIError on failure."""
    cfg = IMAGE_MODELS.get(model_id)
    if not cfg:
        raise AIError(f"Unknown image model '{model_id}'")
    api_key = os.environ.get(cfg["key_env"], "")
    if not api_key:
        raise AIError("Model is not configured on the server")

    payload = {
        "prompt": prompt,
        "mode": "base",
        "cfg_scale": 3.5,
        "width": width,
        "height": height,
        "seed": int(seed),
        "steps": cfg["steps"],
    }
    if negative_prompt:
        payload["negative_prompt"] = negative_prompt

    url = f"{GENAI_BASE}/{cfg['slug']}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    # NVIDIA hosted endpoints occasionally return transient 4xx/5xx; retry once.
    resp = None
    last_err = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                break
            last_err = f"Image service error ({resp.status_code}): {resp.text[:200]}"
        except httpx.HTTPError as e:
            last_err = f"Network error contacting image service: {e}"
        if attempt == 0:
            await asyncio.sleep(1.5)

    if resp is None or resp.status_code != 200:
        raise AIError(last_err or "Image service unavailable")

    data = resp.json()
    artifacts = data.get("artifacts") or []
    if not artifacts or not artifacts[0].get("base64"):
        # Some responses use `image` or `b64_json`
        b64 = data.get("image") or (data.get("data") or [{}])[0].get("b64_json")
        if not b64:
            raise AIError("Image service returned no image")
        return b64
    return artifacts[0]["base64"]


async def chat(messages, model: str = "meta/llama-3.1-8b-instruct", max_tokens: int = 800) -> str:
    api_key = os.environ.get("NVIDIA_LLM_KEY", "")
    if not api_key:
        raise AIError("Chat is not configured on the server")
    url = f"{LLM_BASE}/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": 0.7}
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(url, headers=headers, json=payload)
    except httpx.HTTPError as e:
        raise AIError(f"Network error contacting chat service: {e}")
    if resp.status_code != 200:
        raise AIError(f"Chat service error ({resp.status_code}): {resp.text[:300]}")
    data = resp.json()
    return data["choices"][0]["message"]["content"]
