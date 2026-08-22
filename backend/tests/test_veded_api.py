"""VEDED backend tests — REAL NVIDIA FLUX images, FLUX+ffmpeg video/movie, Sarvam TTS + BookStream dub.

Notes:
- Free wallet: image=10, video=1, audio_chars=2000, dubbing=0.
- Video/movie via FLUX+ffmpeg can take 30-60s; use generous timeouts.
- Sarvam placeholder fallback is acceptable per spec.
"""
import os
import uuid
import pytest
import requests
from pathlib import Path
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"')
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


def bearer(t):
    return {"Authorization": f"Bearer {t}"}


def _grant(email, **fields):
    mongo = MongoClient(MONGO_URL)
    db = mongo[DB_NAME]
    setmap = {f"wallet.{k}": v for k, v in fields.items()}
    db.users.update_one({"email": email.lower()}, {"$set": setmap})
    mongo.close()


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _new_user(s, **grants):
    email = f"TEST_{uuid.uuid4().hex[:8]}@veded.app"
    r = s.post(f"{API}/auth/signup", json={"email": email, "password": "Test@1234", "name": "Tester"})
    assert r.status_code == 200, r.text
    d = r.json()
    if grants:
        _grant(email, **grants)
    return {"email": email, "token": d["token"], "user": d["user"]}


@pytest.fixture(scope="session")
def user(s):
    return _new_user(s)


# ---------- health ----------
def test_health(s):
    r = s.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


# ---------- auth ----------
class TestAuth:
    def test_signup_wallet_defaults(self, user):
        w = user["user"]["wallet"]
        assert w["image_credits"] == 10
        assert w["video_credits"] == 1
        assert w["audio_chars"] == 2000

    def test_login_and_me(self, s, user):
        r = s.post(f"{API}/auth/login", json={"email": user["email"], "password": "Test@1234"})
        assert r.status_code == 200
        r2 = s.get(f"{API}/auth/me", headers=bearer(user["token"]))
        assert r2.status_code == 200

    def test_duplicate_signup_409(self, s, user):
        r = s.post(f"{API}/auth/signup", json={"email": user["email"], "password": "Test@1234"})
        assert r.status_code == 409

    def test_bad_login_401(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "nobody@veded.app", "password": "nope"})
        assert r.status_code == 401

    def test_me_no_token_401(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- image gen (REAL NVIDIA FLUX) ----------
class TestImageFlux:
    def test_generate_image_flux_1x1(self, s, user):
        r = s.post(f"{API}/veded/generate", headers=bearer(user["token"]),
                   json={"kind": "image", "prompt": "TEST a red apple on wooden table",
                         "style": "cinematic", "aspect_ratio": "1:1"}, timeout=180)
        assert r.status_code == 200, r.text
        cr = r.json()["creation"]
        assert cr["status"] == "completed"
        assert cr["generator_used"] == "nvidia-flux.1-dev", f"got={cr.get('generator_used')}"
        assert cr["output_url"].startswith("data:image/jpeg;base64,")
        assert r.json()["wallet"]["image_credits"] == 9

    @pytest.mark.parametrize("aspect", ["16:9", "9:16"])
    def test_generate_image_flux_aspects(self, s, aspect):
        # fresh user for each aspect; grant image credits
        u = _new_user(s, image_credits=5)
        r = s.post(f"{API}/veded/generate", headers=bearer(u["token"]),
                   json={"kind": "image", "prompt": f"TEST landscape mountain aspect {aspect}",
                         "aspect_ratio": aspect}, timeout=180)
        assert r.status_code == 200, r.text
        cr = r.json()["creation"]
        assert cr["generator_used"] == "nvidia-flux.1-dev"
        assert cr["output_url"].startswith("data:image/jpeg;base64,")
        assert r.json()["wallet"]["image_credits"] == 4


# ---------- video (REAL FLUX + ffmpeg) ----------
class TestVideoReal:
    def test_generate_video_mp4(self, s):
        u = _new_user(s, video_credits=3)
        r = s.post(f"{API}/veded/generate", headers=bearer(u["token"]),
                   json={"kind": "video", "prompt": "TEST cinematic drone shot over neon city",
                         "aspect_ratio": "16:9"}, timeout=180)
        assert r.status_code == 200, r.text
        cr = r.json()["creation"]
        assert cr["status"] == "completed"
        assert cr["generator_used"] == "nvidia-flux+ffmpeg", f"got={cr.get('generator_used')} url={cr.get('output_url')}"
        url = cr["output_url"]
        assert url.endswith(".mp4")
        assert "/api/veded/media/" in url
        # Wallet decremented by 1
        assert r.json()["wallet"]["video_credits"] == 2
        # Resolve relative URL against BASE_URL for fetch
        fetch_url = url if url.startswith("http") else f"{BASE_URL}{url}"
        fetched = requests.get(fetch_url, timeout=90, headers={"User-Agent": "Mozilla/5.0"})
        assert fetched.status_code == 200, f"got {fetched.status_code}"
        assert fetched.headers.get("content-type", "").startswith("video/mp4")
        assert len(fetched.content) > 1000


# ---------- movie (REAL FLUX + ffmpeg, 5-credit cost) ----------
class TestMovieReal:
    def test_generate_movie_mp4(self, s):
        u = _new_user(s, video_credits=10)
        r = s.post(f"{API}/veded/generate", headers=bearer(u["token"]),
                   json={"kind": "movie", "prompt": "TEST epic movie shot desert dunes",
                         "aspect_ratio": "16:9"}, timeout=240)
        assert r.status_code == 200, r.text
        cr = r.json()["creation"]
        assert cr["status"] == "completed"
        assert cr["generator_used"] == "nvidia-flux+ffmpeg"
        assert cr["output_url"].endswith(".mp4")
        assert "/api/veded/media/" in cr["output_url"]
        # Movie costs 5
        assert r.json()["wallet"]["video_credits"] == 5


# ---------- audio (Sarvam or placeholder acceptable) ----------
class TestAudio:
    def test_generate_audio(self, s, user):
        r = s.post(f"{API}/veded/generate", headers=bearer(user["token"]),
                   json={"kind": "audio", "prompt": "Namaste, VEDED Sarvam test.",
                         "options": {"language": "hi-IN", "speaker": "anushka"}}, timeout=90)
        assert r.status_code == 200, r.text
        cr = r.json()["creation"]
        assert cr["status"] == "completed"
        assert cr["output_url"]
        assert cr["generator_used"] in ("sarvam-bulbul", "placeholder")
        if cr["generator_used"] == "sarvam-bulbul":
            assert cr["output_url"].startswith("data:audio/")


# ---------- BookStream ----------
class TestBookStream:
    def test_catalog(self, s):
        r = s.get(f"{API}/bookstream/content")
        assert r.status_code == 200
        items = r.json()["items"]
        assert any(c["id"] == "the-neon-archive" for c in items)

    def test_dub_neon_archive(self, s):
        u = _new_user(s, dubbing_credits=10)
        r = s.post(f"{API}/bookstream/dub", headers=bearer(u["token"]),
                   json={"content_id": "the-neon-archive", "language": "hi"}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        track = d["track"]
        assert track["generator_used"] in ("sarvam-bulbul", "placeholder")
        if track["generator_used"] == "sarvam-bulbul":
            assert track["dubbed_audio_url"].startswith("data:audio/")
        # dubbing cost = 5
        assert d["wallet"]["dubbing_credits"] == 5


# ---------- creations list includes mp4 video ----------
class TestCreationsList:
    def test_creations_include_video_mp4(self, s):
        u = _new_user(s, video_credits=3)
        # Generate a video
        r = s.post(f"{API}/veded/generate", headers=bearer(u["token"]),
                   json={"kind": "video", "prompt": "TEST list mp4 shot",
                         "aspect_ratio": "16:9"}, timeout=180)
        assert r.status_code == 200, r.text
        lst = s.get(f"{API}/veded/creations", headers=bearer(u["token"]))
        assert lst.status_code == 200
        items = lst.json()["items"]
        vids = [i for i in items if i["type"] == "video"]
        assert vids, "No video items in creations"
        assert any(i.get("output_url", "").endswith(".mp4") for i in vids)


# ---------- insufficient credits ----------
class TestInsufficient:
    def test_402_image(self, s):
        u = _new_user(s, image_credits=0)
        r = s.post(f"{API}/veded/generate", headers=bearer(u["token"]),
                   json={"kind": "image", "prompt": "TEST"})
        assert r.status_code == 402
