def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["app"] == "MediScan AI API"
    assert payload["modelReady"] is False


def test_list_studies_returns_seed_data(client):
    response = client.get("/api/studies")
    assert response.status_code == 200
    studies = response.json()
    assert len(studies) >= 1
    assert {"id", "patientName", "prediction"} <= set(studies[0].keys())


def test_get_study_by_id(client):
    studies = client.get("/api/studies").json()
    study_id = studies[0]["id"]

    response = client.get(f"/api/studies/{study_id}")
    assert response.status_code == 200
    assert response.json()["id"] == study_id


def test_create_update_delete_study(client):
    create_response = client.post(
        "/api/studies",
        json={
            "patientName": "CI Test Patient",
            "prediction": {
                "label": "Normal",
                "confidence": 0.91,
                "findings": [],
                "classificationMode": "nih14",
            },
            "imageUrl": "/placeholder-xray.svg",
            "notes": "created in test",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    study_id = created["id"]
    assert created["patientName"] == "CI Test Patient"

    patch_response = client.patch(
        f"/api/studies/{study_id}",
        json={"notes": "updated in test", "status": "Reviewed"},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["notes"] == "updated in test"
    assert patch_response.json()["status"] == "Reviewed"

    delete_response = client.delete(f"/api/studies/{study_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/studies/{study_id}").status_code == 404


def test_dashboard_stats(client):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    payload = response.json()
    assert "stats" in payload
    assert "findingDistribution" in payload
    assert payload["stats"]["totalStudies"] >= 1


def test_dashboard_trends(client):
    response = client.get("/api/dashboard/trends?days=7")
    assert response.status_code == 200
    trends = response.json()
    assert len(trends) == 7
    assert {"date", "formattedDate", "totalStudies", "abnormalCount"} <= set(
        trends[0].keys()
    )


def test_accept_and_override_review(client):
    create_response = client.post(
        "/api/studies",
        json={
            "patientName": "Review Test",
            "status": "Pending",
            "prediction": {
                "label": "Nodule",
                "confidence": 0.8,
                "findings": [],
                "classificationMode": "nih14",
            },
            "imageUrl": "/placeholder-xray.svg",
            "notes": "",
        },
    )
    assert create_response.status_code == 201
    study_id = create_response.json()["id"]
    assert create_response.json()["review"] is None

    accept = client.post(
        f"/api/studies/{study_id}/review",
        json={"decision": "accepted", "note": "Looks correct"},
    )
    assert accept.status_code == 200
    accepted = accept.json()
    assert accepted["status"] == "Reviewed"
    assert accepted["review"]["decision"] == "accepted"
    assert accepted["review"]["finalLabel"] == "Nodule"
    assert accepted["prediction"]["label"] == "Nodule"

    override = client.post(
        f"/api/studies/{study_id}/review",
        json={
            "decision": "overridden",
            "finalLabel": "Mass",
            "note": "Favors mass",
        },
    )
    assert override.status_code == 200
    overridden = override.json()
    assert overridden["review"]["decision"] == "overridden"
    assert overridden["review"]["finalLabel"] == "Mass"
    assert overridden["prediction"]["label"] == "Nodule"

    bad = client.post(
        f"/api/studies/{study_id}/review",
        json={"decision": "overridden", "finalLabel": "Nodule"},
    )
    assert bad.status_code == 400

    stats = client.get("/api/dashboard/stats").json()["stats"]
    assert "overrideRate" in stats
    assert "reviewedCount" in stats
    assert stats["pendingReview"] >= 0


def test_chat_requires_groq_api_key(client):
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "What is effusion?"}]},
    )
    assert response.status_code == 503
    assert "GROQ_API_KEY" in response.json()["detail"]


def test_chat_with_mocked_groq(client, monkeypatch):
    monkeypatch.setattr(
        "app.services.chat_service.settings.groq_api_key", "test-key"
    )
    monkeypatch.setattr(
        "app.services.chat_service.settings.groq_model", "llama-3.1-8b-instant"
    )

    class FakeResponse:
        status_code = 200

        def json(self):
            return {
                "model": "llama-3.1-8b-instant",
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Effusion is fluid in the pleural space. Clinical correlation required.",
                        }
                    }
                ],
            }

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, *args, **kwargs):
            return FakeResponse()

    monkeypatch.setattr("app.services.chat_service.httpx.AsyncClient", FakeAsyncClient)

    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "What is effusion?"}]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"]["role"] == "assistant"
    assert "Effusion" in payload["message"]["content"]
    assert payload["model"] == "llama-3.1-8b-instant"


def test_chat_with_study_context(client, monkeypatch):
    monkeypatch.setattr(
        "app.services.chat_service.settings.groq_api_key", "test-key"
    )

    captured = {}

    class FakeResponse:
        status_code = 200

        def json(self):
            return {
                "model": "llama-3.1-8b-instant",
                "choices": [
                    {"message": {"role": "assistant", "content": "Noted."}}
                ],
            }

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, headers=None, json=None):
            captured["json"] = json
            return FakeResponse()

    monkeypatch.setattr("app.services.chat_service.httpx.AsyncClient", FakeAsyncClient)

    studies = client.get("/api/studies").json()
    study_id = studies[0]["id"]

    response = client.post(
        "/api/chat",
        json={
            "messages": [{"role": "user", "content": "Summarize this study."}],
            "studyId": study_id,
        },
    )
    assert response.status_code == 200
    assert response.json()["studyId"] == study_id
    system_contents = [
        m["content"] for m in captured["json"]["messages"] if m["role"] == "system"
    ]
    assert any(study_id in content for content in system_contents)
    assert any("aiPrimaryLabel" in content for content in system_contents)
