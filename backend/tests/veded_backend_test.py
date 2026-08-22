"""VEDED backend end-to-end tests. Covers auth, config, image gen, gallery,
publish/discover, chat, video (503), UPI payments and admin approval flow."""
import os
import time
import uuid
import base64

import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # fallback to frontend/.env
    from pathlib import Path
    envp = Path('/app/frontend/.env')
    for line in envp.read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')

API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@veded.app"
ADMIN_PASSWORD = "VededAdmin@2026"

# ---------- fixtures ----------
@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess

@pytest.fixture(scope="session")
def user_ctx(s):
    """Fresh registered user; token + user info."""
    email = f"TEST_user_{uuid.uuid4().hex[:8]}@veded.app"
    r = s.post(f"{API}/auth/register", json={"name": "Tester", "email": email, "password": "Test@1234"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "password": "Test@1234", "token": data["token"], "user": data["user"]}

@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]

def bearer(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- auth ----------
class TestAuth:
    def test_register_returns_token_and_60_credits(self, user_ctx):
        assert user_ctx["token"]
        assert user_ctx["user"]["credits"] == 60
        assert user_ctx["user"]["plan"] == "free"
        assert user_ctx["user"]["role"] == "user"

    def test_login_works(self, s, user_ctx):
        r = s.post(f"{API}/auth/login", json={"email": user_ctx["email"], "password": user_ctx["password"]})
        assert r.status_code == 200
        assert "token" in r.json()

    def test_me_returns_user(self, s, user_ctx):
        r = s.get(f"{API}/auth/me", headers=bearer(user_ctx["token"]))
        assert r.status_code == 200
        assert r.json()["email"] == user_ctx["email"].lower()

    def test_invalid_login_401(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "nobody@veded.app", "password": "wrong"})
        assert r.status_code == 401

    def test_me_no_token_401(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- config / pricing ----------
class TestConfig:
    def test_config(self, s):
        r = s.get(f"{API}/config")
        assert r.status_code == 200
        d = r.json()
        assert "image_models" in d and len(d["image_models"]) >= 1
        assert d["razorpay_enabled"] is False
        assert any(p["id"] == "pro" for p in d["plans"])
        assert d["credit_packs"]

    def test_pricing_margin(self, s):
        r = s.get(f"{API}/pricing")
        assert r.status_code == 200
        d = r.json()
        assert abs(d["profit_margin"] - 0.40) < 1e-6
        pro = next(p for p in d["plans"] if p["id"] == "pro")
        assert pro["price"] == 499
        # cost_basis = round(499 * 0.6) = 299; profit = 200
        assert pro["cost_basis"] == round(499 * 0.60)
        assert pro["profit"] == 499 - pro["cost_basis"]


# ---------- image generation ----------
class TestImageGen:
    def test_generate_flux_dev(self, s, user_ctx):
        before = s.get(f"{API}/auth/me", headers=bearer(user_ctx["token"])).json()["credits"]
        r = None
        # NVIDIA hosted API occasionally returns 422/5xx transiently; retry up to 3x.
        for attempt in range(3):
            r = s.post(f"{API}/generate/image", headers=bearer(user_ctx["token"]),
                       json={"prompt": "TEST a red apple on wooden table", "model": "flux-dev",
                             "width": 1024, "height": 1024}, timeout=180)
            if r.status_code == 200:
                break
            time.sleep(3)
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:300]}"
        d = r.json()
        assert d["cost"] == 6
        assert d["credits"] == before - 6
        assert d["url"].startswith("/api/media/")
        assert d["id"]
        # store for downstream
        pytest.veded_media_id = d["id"]
        pytest.veded_credits_after_gen = d["credits"]

    def test_media_returns_jpeg(self, s):
        media_id = getattr(pytest, "veded_media_id", None)
        assert media_id, "prior generation test failed"
        r = s.get(f"{API}/media/{media_id}")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/jpeg")
        assert len(r.content) > 1000

    def test_gallery_lists_item_without_b64(self, s, user_ctx):
        r = s.get(f"{API}/gallery", headers=bearer(user_ctx["token"]))
        assert r.status_code == 200
        arr = r.json()
        assert any(m["id"] == getattr(pytest, "veded_media_id", "") for m in arr)
        for m in arr:
            assert "b64" not in m

    def test_publish_appears_in_discover(self, s, user_ctx):
        media_id = getattr(pytest, "veded_media_id", None)
        assert media_id
        r = s.post(f"{API}/publish", headers=bearer(user_ctx["token"]),
                   json={"media_id": media_id, "title": "TEST Apple", "category": "AI Art"})
        assert r.status_code == 200
        r2 = s.get(f"{API}/discover")
        assert r2.status_code == 200
        ids = [i["id"] for i in r2.json()["items"]]
        assert media_id in ids

    def test_unknown_model_400(self, s, user_ctx):
        r = s.post(f"{API}/generate/image", headers=bearer(user_ctx["token"]),
                   json={"prompt": "x", "model": "nope"})
        assert r.status_code == 400

    def test_flux_schnell_optional(self, s, user_ctx):
        # Schnell may 502 (hosted endpoint quirky) — acceptable per spec.
        r = s.post(f"{API}/generate/image", headers=bearer(user_ctx["token"]),
                   json={"prompt": "TEST schnell cat", "model": "flux-schnell",
                         "width": 512, "height": 512}, timeout=180)
        if r.status_code == 200:
            assert r.json()["cost"] == 3
        else:
            assert r.status_code in (502, 504), f"unexpected: {r.status_code} {r.text[:200]}"


# ---------- insufficient credits ----------
class TestCredits:
    def test_402_when_exhausted(self, s):
        # Fresh user with 60 credits. flux-dev = 6 credits → 10 generations exhausts.
        # To avoid hammering NVIDIA API, register a user, force credits to 5 via chat
        # is not possible w/o DB access. Instead, do a single small-cost attempt path:
        # Use chat (1 credit) — but we still need to hit 402. Easier: use a user with
        # credits < 6 via generating until fail is slow. We'll register a new user and
        # spam small chat calls; if chat requires LLM key it may fail too. Alternative:
        # test the guard directly by trying image gen with a user that has 0 credits
        # after admin manipulation is not possible here. So test through /chat with
        # a fresh account after we exhaust credits via chat calls.
        # Simpler: create user, then call /generate/image with model that costs > credits
        # is impossible since min cost is 3 and users get 60. So skip real exhaustion
        # and just check 402 via a targeted scenario: we set credits low is not possible.
        # We'll do the more direct approach: register user and call chat 60 times is
        # too slow. Instead — do ONE image gen at cost 6, then simulate insufficient
        # by testing user with 0 credits via admin? Not available.
        # Best path: register user then attempt an image with 61+ implied cost by
        # calling /generate/image after we've consumed credits via chat loop is slow.
        # Given constraints, we do a functional check: register, then chain 10x
        # flux-schnell (3 credits) generations = 30 credits total; then attempt one
        # more that requires 6 (flux-dev) when only 0 remain — but that takes minutes.
        # We'll take a lighter approach and simply verify the 402 code path with
        # /chat once we exhaust credits with chat. This still calls LLM many times.
        # ==> To keep tests fast & reliable, we assert the guard via direct DB
        # manipulation using pymongo (allowed since tests run in-container).
        try:
            from pymongo import MongoClient
            from bson import ObjectId
        except Exception:
            pytest.skip("pymongo not available")
        mongo = MongoClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
        db = mongo[os.environ.get('DB_NAME', 'test_database')]
        # create user
        email = f"TEST_broke_{uuid.uuid4().hex[:6]}@veded.app"
        r = s.post(f"{API}/auth/register", json={"name": "Broke", "email": email, "password": "Test@1234"})
        assert r.status_code == 200
        tok = r.json()["token"]
        # zero out credits (backend lowercases emails at register)
        db.users.update_one({"email": email.lower()}, {"$set": {"credits": 0}})
        r2 = s.post(f"{API}/generate/image", headers=bearer(tok),
                    json={"prompt": "TEST no credit", "model": "flux-dev"})
        assert r2.status_code == 402


# ---------- chat ----------
class TestChat:
    def test_chat_deducts_1_credit(self, s, user_ctx):
        before = s.get(f"{API}/auth/me", headers=bearer(user_ctx["token"])).json()["credits"]
        r = s.post(f"{API}/chat", headers=bearer(user_ctx["token"]),
                   json={"message": "Give me a 5-word prompt for a sunset."}, timeout=90)
        # If LLM fails, we still accept 502 but flag
        if r.status_code == 200:
            d = r.json()
            assert isinstance(d["reply"], str) and len(d["reply"]) > 0
            assert d["credits"] == before - 1
        else:
            pytest.skip(f"chat unavailable: {r.status_code} {r.text[:200]}")


# ---------- video ----------
class TestVideo:
    def test_video_returns_503(self, s, user_ctx):
        before = s.get(f"{API}/auth/me", headers=bearer(user_ctx["token"])).json()["credits"]
        r = s.post(f"{API}/generate/video", headers=bearer(user_ctx["token"]), json={"prompt": "x"})
        assert r.status_code == 503
        assert "coming soon" in r.json()["detail"].lower()
        after = s.get(f"{API}/auth/me", headers=bearer(user_ctx["token"])).json()["credits"]
        assert after == before


# ---------- payments UPI ----------
class TestPayments:
    def test_initiate_submit_and_mine(self, s, user_ctx):
        r = s.post(f"{API}/payments/upi/initiate", headers=bearer(user_ctx["token"]),
                   json={"kind": "plan", "item_id": "pro"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["amount"] == 499
        assert d["credits"] == 1800
        assert "9673856312" in d["upi_id"]
        assert d["note"].startswith("VEDED-")
        assert d["qr"].startswith("data:image/png;base64,")
        pytest.veded_payment_id = d["payment_id"]

        r2 = s.post(f"{API}/payments/upi/submit", headers=bearer(user_ctx["token"]),
                    json={"payment_id": d["payment_id"], "utr": "TESTUTR123456"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "submitted"

        r3 = s.get(f"{API}/payments/mine", headers=bearer(user_ctx["token"]))
        assert r3.status_code == 200
        arr = r3.json()
        mine = [p for p in arr if p["id"] == d["payment_id"]]
        assert mine and mine[0]["status"] == "submitted" and mine[0]["utr"] == "TESTUTR123456"

    def test_free_plan_rejected(self, s, user_ctx):
        r = s.post(f"{API}/payments/upi/initiate", headers=bearer(user_ctx["token"]),
                   json={"kind": "plan", "item_id": "free"})
        assert r.status_code == 400


# ---------- admin ----------
class TestAdmin:
    def test_non_admin_forbidden(self, s, user_ctx):
        r = s.get(f"{API}/admin/payments", headers=bearer(user_ctx["token"]))
        assert r.status_code == 403

    def test_admin_lists_and_approves(self, s, admin_token, user_ctx):
        pid = getattr(pytest, "veded_payment_id", None)
        assert pid, "no payment to approve"
        r = s.get(f"{API}/admin/payments", headers=bearer(admin_token))
        assert r.status_code == 200
        assert any(p["id"] == pid for p in r.json())

        before = s.get(f"{API}/auth/me", headers=bearer(user_ctx["token"])).json()
        cred_before = before["credits"]

        r2 = s.post(f"{API}/admin/payments/{pid}/approve", headers=bearer(admin_token))
        assert r2.status_code == 200

        after = s.get(f"{API}/auth/me", headers=bearer(user_ctx["token"])).json()
        assert after["credits"] == cred_before + 1800
        assert after["plan"] == "pro"
