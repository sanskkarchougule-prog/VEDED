"""Backend API tests for VEDED + BookStream."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://content-studio-core-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Fresh user for isolation
TEST_EMAIL = f"test_{uuid.uuid4().hex[:10]}@veded.io"
TEST_PW = "password123"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    r = session.post(f"{API}/auth/signup", json={"email": TEST_EMAIL, "password": TEST_PW, "name": "Test User"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user": data["user"]}


@pytest.fixture(scope="session")
def auth_headers(auth):
    return {"Authorization": f"Bearer {auth['token']}", "Content-Type": "application/json"}


# --- Health ---
def test_health(session):
    r = session.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


# --- Auth ---
def test_signup_and_wallet_defaults(auth):
    u = auth["user"]
    assert u["email"] == TEST_EMAIL
    assert u["veded_tier"] == "free"
    w = u["wallet"]
    assert w["image_credits"] == 10
    assert w["video_credits"] == 1
    assert w["audio_chars"] == 2000
    assert w["dubbing_credits"] == 0
    assert u["trial_used"] == False


def test_signup_duplicate(session):
    r = session.post(f"{API}/auth/signup", json={"email": TEST_EMAIL, "password": TEST_PW})
    assert r.status_code == 409


def test_login_success(session):
    r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PW})
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_invalid(session):
    r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": "wrongpass"})
    assert r.status_code == 401


def test_me(session, auth_headers):
    r = session.get(f"{API}/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["user"]["email"] == TEST_EMAIL


def test_me_unauthorized(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


# --- VEDED generate ---
def test_generate_image(session, auth_headers):
    r = session.post(f"{API}/veded/generate", headers=auth_headers,
                     json={"kind": "image", "prompt": "cyberpunk city at night", "aspect_ratio": "16:9"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["creation"]["status"] == "completed"
    assert data["creation"]["output_url"]
    # 1 credit deducted
    assert data["wallet"]["image_credits"] == 9


def test_generate_video(session, auth_headers):
    r = session.post(f"{API}/veded/generate", headers=auth_headers,
                     json={"kind": "video", "prompt": "epic drone shot over mountains"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["creation"]["output_url"].endswith(".mp4")
    assert data["wallet"]["video_credits"] == 0


def test_generate_audio(session, auth_headers):
    r = session.post(f"{API}/veded/generate", headers=auth_headers,
                     json={"kind": "audio", "prompt": "hello world narration"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["wallet"]["audio_chars"] == 1500  # 2000 - 500


def test_generate_video_insufficient(session, auth_headers):
    # already used the only video credit
    r = session.post(f"{API}/veded/generate", headers=auth_headers,
                     json={"kind": "video", "prompt": "another shot"})
    assert r.status_code == 402


def test_list_creations(session, auth_headers):
    r = session.get(f"{API}/veded/creations", headers=auth_headers)
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 3


def test_delete_creation(session, auth_headers):
    r = session.get(f"{API}/veded/creations", headers=auth_headers)
    cid = r.json()["items"][0]["id"]
    r2 = session.delete(f"{API}/veded/creations/{cid}", headers=auth_headers)
    assert r2.status_code == 200
    assert r2.json()["deleted"] == 1


# --- BookStream ---
def test_bookstream_content(session):
    r = session.get(f"{API}/bookstream/content")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 4
    assert all("id" in c for c in items)


def test_bookstream_content_detail(session):
    r = session.get(f"{API}/bookstream/content/the-neon-archive")
    assert r.status_code == 200
    assert r.json()["title"] == "The Neon Archive"


def test_bookstream_content_not_found(session):
    r = session.get(f"{API}/bookstream/content/does-not-exist")
    assert r.status_code == 404


def test_bookstream_languages(session):
    r = session.get(f"{API}/bookstream/languages")
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(l["code"] == "hi" for l in items)


def test_bookstream_dub_insufficient(session, auth_headers):
    r = session.post(f"{API}/bookstream/dub", headers=auth_headers,
                     json={"content_id": "the-neon-archive", "language": "hi"})
    assert r.status_code == 402


def test_bookstream_trial_first_ok(session, auth_headers):
    fp = f"fp_{uuid.uuid4().hex[:12]}"
    r = session.post(f"{API}/bookstream/trial", headers=auth_headers,
                     json={"content_id": "the-neon-archive", "device_fingerprint": fp})
    assert r.status_code == 200, r.text
    assert r.json()["granted"] == True


def test_bookstream_trial_second_blocked(session, auth_headers):
    fp = f"fp_{uuid.uuid4().hex[:12]}"
    r = session.post(f"{API}/bookstream/trial", headers=auth_headers,
                     json={"content_id": "sands-of-silence", "device_fingerprint": fp})
    assert r.status_code == 403


# --- Payments ---
def test_get_plans(session):
    r = session.get(f"{API}/plans")
    assert r.status_code == 200
    data = r.json()
    assert len(data["veded"]) >= 3
    assert len(data["bookstream"]) >= 3
    assert len(data["topups"]) >= 3


def test_checkout_free_plan_rejected(session, auth_headers):
    r = session.post(f"{API}/payments/checkout", headers=auth_headers,
                     json={"package_id": "free", "origin_url": BASE_URL})
    assert r.status_code == 400


def test_checkout_unknown_package(session, auth_headers):
    r = session.post(f"{API}/payments/checkout", headers=auth_headers,
                     json={"package_id": "nope_pkg", "origin_url": BASE_URL})
    assert r.status_code == 400


def test_checkout_creates_session(session, auth_headers):
    r = session.post(f"{API}/payments/checkout", headers=auth_headers,
                     json={"package_id": "veded_standard", "origin_url": BASE_URL})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["checkout_url"].startswith("http")
    assert data["session_id"]


def test_payment_status_not_found(session):
    r = session.get(f"{API}/payments/status/nonexistent_session")
    assert r.status_code == 404
