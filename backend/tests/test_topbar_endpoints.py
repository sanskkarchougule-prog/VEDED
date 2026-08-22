"""Tests for the NEW topbar-related endpoints:
- PATCH /api/auth/profile   (rename user)
- GET   /api/auth/notifications  (welcome / creation ready / low-credits)
- GET   /api/veded/search?q=  (case-insensitive prompt filter)
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


@pytest.fixture(scope="module")
def user(s):
    email = f"TEST_{uuid.uuid4().hex[:8]}@veded.app"
    r = s.post(f"{API}/auth/signup", json={"email": email, "password": "Test@1234", "name": "Original"})
    assert r.status_code == 200, r.text
    return {"email": email, **r.json()}


# ---------------- PATCH /auth/profile ----------------
class TestProfileUpdate:
    def test_update_name(self, s, user):
        r = s.patch(f"{API}/auth/profile", json={"name": "Renamed User"}, headers=bearer(user["token"]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["name"] == "Renamed User"
        # verify via /me
        me = s.get(f"{API}/auth/me", headers=bearer(user["token"]))
        assert me.status_code == 200
        assert me.json()["user"]["name"] == "Renamed User"

    def test_ignore_blank_name(self, s, user):
        r = s.patch(f"{API}/auth/profile", json={"name": "   "}, headers=bearer(user["token"]))
        assert r.status_code == 200
        # name stays "Renamed User"
        assert r.json()["user"]["name"] == "Renamed User"

    def test_requires_auth(self, s):
        r = s.patch(f"{API}/auth/profile", json={"name": "Nope"})
        assert r.status_code in (401, 403)


# ---------------- GET /auth/notifications ----------------
class TestNotifications:
    def test_welcome_for_new_user(self, s):
        email = f"TEST_{uuid.uuid4().hex[:8]}@veded.app"
        r = s.post(f"{API}/auth/signup", json={"email": email, "password": "Test@1234"})
        assert r.status_code == 200
        tok = r.json()["token"]
        n = s.get(f"{API}/auth/notifications", headers=bearer(tok))
        assert n.status_code == 200
        d = n.json()
        assert "notifications" in d and "unread" in d
        # Free wallet has image=10 so low-credits alert should NOT appear;
        # but welcome MUST appear because no creations yet.
        ids = [x["id"] for x in d["notifications"]]
        assert "welcome" in ids
        assert d["unread"] == len(d["notifications"])

    def test_low_credits_alert(self, s):
        email = f"TEST_{uuid.uuid4().hex[:8]}@veded.app"
        r = s.post(f"{API}/auth/signup", json={"email": email, "password": "Test@1234"})
        tok = r.json()["token"]
        _grant(email, image_credits=1)
        n = s.get(f"{API}/auth/notifications", headers=bearer(tok))
        assert n.status_code == 200
        ids = [x["id"] for x in n.json()["notifications"]]
        assert "low-credits" in ids


# ---------------- GET /veded/search ----------------
class TestSearch:
    def test_search_filters_by_prompt(self, s, user):
        # Seed a creation directly via mongo (avoids paying for real gen)
        mongo = MongoClient(MONGO_URL)
        db = mongo[DB_NAME]
        cid = uuid.uuid4().hex
        db.creations.insert_one({
            "id": cid,
            "user_id": user["user"]["id"],
            "type": "image",
            "prompt": "A majestic neon TIGER prowling",
            "output_url": "https://example.com/tiger.jpg",
            "status": "completed",
            "created_at": "2026-01-01T00:00:00Z",
        })
        mongo.close()

        # case-insensitive match
        r = s.get(f"{API}/veded/search?q=tiger", headers=bearer(user["token"]))
        assert r.status_code == 200
        d = r.json()
        assert d["count"] >= 1
        assert any(c["id"] == cid for c in d["results"])

        r2 = s.get(f"{API}/veded/search?q=TIGER", headers=bearer(user["token"]))
        assert r2.status_code == 200
        assert any(c["id"] == cid for c in r2.json()["results"])

    def test_search_empty(self, s, user):
        r = s.get(f"{API}/veded/search?q=zzzznonsense_{uuid.uuid4().hex[:6]}", headers=bearer(user["token"]))
        assert r.status_code == 200
        assert r.json()["count"] == 0

    def test_search_requires_auth(self, s):
        r = s.get(f"{API}/veded/search?q=x")
        assert r.status_code in (401, 403)

    def test_notifications_shows_creation_ready(self, s, user):
        # After seeding a creation the notification feed should include a "... ready" item
        n = s.get(f"{API}/auth/notifications", headers=bearer(user["token"]))
        assert n.status_code == 200
        items = n.json()["notifications"]
        assert any("ready" in i["title"].lower() for i in items)
