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
