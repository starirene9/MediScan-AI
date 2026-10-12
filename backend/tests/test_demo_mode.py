import pytest

from app.config import settings
from app.db.seed import SEED_SPECS
from app.services import demo_service

_STUDY = {
    "patientName": "Demo Visitor",
    "prediction": {"label": "Nodule", "confidence": 0.8, "findings": []},
    "imageUrl": "/placeholder-xray.svg",
}


@pytest.fixture
def demo(monkeypatch):
    monkeypatch.setattr(settings, "demo_mode", True)
    demo_service.limiter.reset()
    yield
    demo_service.limiter.reset()


def test_health_reports_demo_mode(client, demo):
    assert client.get("/api/health").json()["demoMode"] is True


def test_demo_blocks_delete_and_patient_edits(client, demo):
    study_id = client.post("/api/studies", json=_STUDY).json()["id"]

    assert client.delete(f"/api/studies/{study_id}").status_code == 403
    assert (
        client.patch(f"/api/studies/{study_id}", json={"patientName": "Changed"}).status_code
        == 403
    )

    notes = client.patch(f"/api/studies/{study_id}", json={"notes": "demo note"})
    assert notes.status_code == 200
    assert notes.json()["notes"] == "demo note"


def test_demo_rate_limits_writes(client, demo, monkeypatch):
    monkeypatch.setattr(settings, "demo_write_limit", 2)

    assert client.post("/api/studies", json=_STUDY).status_code == 201
    assert client.post("/api/studies", json=_STUDY).status_code == 201
    limited = client.post("/api/studies", json=_STUDY)
    assert limited.status_code == 429
    assert "Retry-After" in limited.headers


def test_demo_rate_limits_chat_per_client(client, demo, monkeypatch):
    monkeypatch.setattr(settings, "demo_chat_limit", 1)
    body = {"messages": [{"role": "user", "content": "hi"}]}

    # 503: no GROQ key in tests, but the request still counts toward the limit.
    assert client.post("/api/chat", json=body).status_code == 503
    assert client.post("/api/chat", json=body).status_code == 429
    other = client.post("/api/chat", json=body, headers={"X-Forwarded-For": "203.0.113.9"})
    assert other.status_code == 503


def test_reset_restores_seed_and_clears_uploads(client, demo):
    client.post("/api/studies", json=_STUDY)
    upload = demo_service.ensure_upload_dir() / "visitor.png"
    upload.write_bytes(b"x")

    demo_service.reset_demo_data()

    ids = {s["id"] for s in client.get("/api/studies").json()}
    assert ids == {spec["id"] for spec in SEED_SPECS}
    assert not upload.exists()


def test_local_mode_is_unrestricted(client):
    study_id = client.post("/api/studies", json=_STUDY).json()["id"]
    assert client.patch(f"/api/studies/{study_id}", json={"age": 50}).status_code == 200
    assert client.delete(f"/api/studies/{study_id}").status_code == 204
