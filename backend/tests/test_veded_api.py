"""VEDED restored repo backend tests: auth, generate (image/audio/video/movie), plans, payments."""
import os
import uuid
import pytest
import requests
from pathlib import Path

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"')
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


def bearer(t):
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def user(s):
    email = f"TEST_user_{uuid.uuid4().hex[:8]}@veded.app"
    pw = "Test@1234"
    r = s.post(f"{API}/auth/signup", json={"email": email, "password": pw, "name": "Tester"})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "password": pw, "token": d["token"], "user": d["user"]}


# ---------- health ----------
def test_health(s):
    r = s.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


# ---------- auth ----------
class TestAuth:
    def test_signup_returns_token_and_wallet(self, user):
        assert user["token"]
        u = user["user"]
        assert u["email"] == user["email"].lower()
        w = u["wallet"]
        assert w["image_credits"] == 10
        assert w["video_credits"] == 1
        assert w["audio_chars"] == 2000

    def test_login_works(self, s, user):
        r = s.post(f"{API}/auth/login", json={"email": user["email"], "password": user["password"]})
        assert r.status_code == 200
        assert "token" in r.json()

    def test_me(self, s, user):
        r = s.get(f"{API}/auth/me", headers=bearer(user["token"]))
        assert r.status_code == 200
        assert r.json()["user"]["email"] == user["email"].lower()

    def test_duplicate_signup_409(self, s, user):
        r = s.post(f"{API}/auth/signup", json={"email": user["email"], "password": "Test@1234"})
        assert r.status_code == 409

    def test_bad_login_401(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "nobody@veded.app", "password": "nope"})
        assert r.status_code == 401

    def test_me_no_token_401(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- plans ----------
class TestPlans:
    def test_plans_shape(self, s):
        r = s.get(f"{API}/plans")
        assert r.status_code == 200
        d = r.json()
        for key in ("veded", "bookstream", "topups", "feature_groups"):
            assert key in d and isinstance(d[key], list)
        ids = [p["id"] for p in d["veded"]]
        assert "veded_pro" in ids


# ---------- image gen (REAL Nano Banana) ----------
class TestImageGen:
    def test_generate_image_real(self, s, user):
        r = s.post(f"{API}/veded/generate", headers=bearer(user["token"]),
                   json={"kind": "image", "prompt": "TEST a red apple on wooden table",
                         "style": "cinematic"}, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        cr = d["creation"]
        assert cr["status"] == "completed"
        assert cr["generator_used"] == "gemini-nano-banana", f"generator={cr.get('generator_used')} url={str(cr.get('output_url'))[:80]}"
        assert cr["output_url"].startswith("data:image/")
        # wallet decremented by 1
        assert d["wallet"]["image_credits"] == 9

    def test_creations_list_contains_item(self, s, user):
        r = s.get(f"{API}/veded/creations", headers=bearer(user["token"]))
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 1
        assert items[0]["type"] == "image"

    def test_delete_creation(self, s, user):
        items = s.get(f"{API}/veded/creations", headers=bearer(user["token"])).json()["items"]
        cid = items[0]["id"]
        r = s.delete(f"{API}/veded/creations/{cid}", headers=bearer(user["token"]))
        assert r.status_code == 200
        assert r.json()["deleted"] == 1


# ---------- insufficient credits ----------
class TestInsufficient:
    def test_402_when_image_credits_zero(self, s):
        # Isolated user, drain via mongo
        from pymongo import MongoClient
        email = f"TEST_broke_{uuid.uuid4().hex[:6]}@veded.app"
        r = s.post(f"{API}/auth/signup", json={"email": email, "password": "Test@1234"})
        assert r.status_code == 200
        tok = r.json()["token"]
        mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        db = mongo[os.environ.get("DB_NAME", "test_database")]
        db.users.update_one({"email": email.lower()}, {"$set": {"wallet.image_credits": 0}})
        r2 = s.post(f"{API}/veded/generate", headers=bearer(tok),
                    json={"kind": "image", "prompt": "TEST no credit"})
        assert r2.status_code == 402


# ---------- audio ----------
class TestAudio:
    def test_generate_audio(self, s, user):
        r = s.post(f"{API}/veded/generate", headers=bearer(user["token"]),
                   json={"kind": "audio", "prompt": "Hello VEDED, this is a Sarvam test.",
                         "options": {"language": "hi-IN", "speaker": "anushka"}}, timeout=90)
        assert r.status_code == 200, r.text
        cr = r.json()["creation"]
        assert cr["status"] == "completed"
        assert cr["output_url"]
        # Sarvam OR placeholder acceptable
        assert cr["generator_used"] in ("sarvam-bulbul", "placeholder")


# ---------- video / movie placeholders ----------
class TestVideoMovie:
    def test_video_placeholder(self, s, user):
        r = s.post(f"{API}/veded/generate", headers=bearer(user["token"]),
                   json={"kind": "video", "prompt": "TEST cinematic drone shot"})
        assert r.status_code == 200, r.text
        cr = r.json()["creation"]
        assert cr["status"] == "completed"
        assert ".mp4" in cr["output_url"]

    def test_movie_placeholder(self, s, user):
        # Fresh user: video_credits=1 was consumed above. So use a new user for movie (needs 5).
        email = f"TEST_movie_{uuid.uuid4().hex[:6]}@veded.app"
        r = s.post(f"{API}/auth/signup", json={"email": email, "password": "Test@1234"})
        tok = r.json()["token"]
        # grant credits
        from pymongo import MongoClient
        mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        db = mongo[os.environ.get("DB_NAME", "test_database")]
        db.users.update_one({"email": email.lower()}, {"$set": {"wallet.video_credits": 10}})
        r2 = s.post(f"{API}/veded/generate", headers=bearer(tok),
                    json={"kind": "movie", "prompt": "TEST movie"})
        assert r2.status_code == 200, r2.text
        cr = r2.json()["creation"]
        assert cr["status"] == "completed"
        assert ".mp4" in cr["output_url"]


# ---------- payments ----------
class TestPayments:
    def test_checkout_veded_pro(self, s, user):
        r = s.post(f"{API}/payments/checkout", headers=bearer(user["token"]),
                   json={"package_id": "veded_pro", "origin_url": BASE_URL})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["checkout_url"].startswith("http")
        assert d["session_id"]
        pytest.veded_session_id = d["session_id"]

    def test_status_pending(self, s):
        sid = getattr(pytest, "veded_session_id", None)
        assert sid
        r = s.get(f"{API}/payments/status/{sid}")
        assert r.status_code == 200
        d = r.json()
        assert d["session_id"] == sid
        assert "status" in d and "payment_status" in d

    def test_free_package_400(self, s, user):
        r = s.post(f"{API}/payments/checkout", headers=bearer(user["token"]),
                   json={"package_id": "free", "origin_url": BASE_URL})
        assert r.status_code == 400

    def test_unknown_package_400(self, s, user):
        r = s.post(f"{API}/payments/checkout", headers=bearer(user["token"]),
                   json={"package_id": "not_a_pkg", "origin_url": BASE_URL})
        assert r.status_code == 400
