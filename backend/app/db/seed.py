from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.entities import StudyEntity

# Relative offsets from "now" so dashboard trends always include seed data.
SEED_SPECS = [
    {
        "id": "S001",
        "patient_id": "P001",
        "patient_name": "John Smith",
        "age": 45,
        "gender": "Male",
        "days_ago": 2,
        "hour": 9,
        "minute": 30,
        "status": "Pending",
        "prediction_label": "Nodule",
        "prediction_confidence": 0.87,
        "image_url": "/placeholder-xray.svg",
        "grad_cam_url": "/placeholder-xray.svg",
        "notes": "",
        "review_decision": None,
        "final_label": None,
        "review_note": None,
    },
    {
        "id": "S002",
        "patient_id": "P002",
        "patient_name": "Emily Johnson",
        "age": 32,
        "gender": "Female",
        "days_ago": 2,
        "hour": 11,
        "minute": 15,
        "status": "Pending",
        "prediction_label": "Pneumonia",
        "prediction_confidence": 0.92,
        "image_url": "/placeholder-xray.svg",
        "grad_cam_url": "/placeholder-xray.svg",
        "notes": "Follow-up recommended in 2 weeks.",
        "review_decision": None,
        "final_label": None,
        "review_note": None,
    },
    {
        "id": "S003",
        "patient_id": "P003",
        "patient_name": "Robert Williams",
        "age": 58,
        "gender": "Male",
        "days_ago": 1,
        "hour": 8,
        "minute": 0,
        "status": "Reviewed",
        "prediction_label": "Normal",
        "prediction_confidence": 0.95,
        "image_url": "/placeholder-xray.svg",
        "grad_cam_url": None,
        "notes": "",
        "review_decision": "accepted",
        "final_label": "Normal",
        "review_note": "Agrees with AI screening.",
    },
    {
        "id": "S004",
        "patient_id": "P004",
        "patient_name": "Sophia Garcia",
        "age": 29,
        "gender": "Female",
        "days_ago": 1,
        "hour": 14,
        "minute": 20,
        "status": "Pending",
        "prediction_label": "Effusion",
        "prediction_confidence": 0.62,
        "image_url": "/placeholder-xray.svg",
        "grad_cam_url": None,
        "notes": "",
        "review_decision": None,
        "final_label": None,
        "review_note": None,
    },
    {
        "id": "S005",
        "patient_id": "P005",
        "patient_name": "David Kim",
        "age": 67,
        "gender": "Male",
        "days_ago": 0,
        "hour": 7,
        "minute": 45,
        "status": "Reviewed",
        "prediction_label": "Nodule",
        "prediction_confidence": 0.78,
        "image_url": "/placeholder-xray.svg",
        "grad_cam_url": "/placeholder-xray.svg",
        "notes": "Biopsy scheduled.",
        "review_decision": "overridden",
        "final_label": "Mass",
        "review_note": "Morphology favors mass over nodule; biopsy scheduled.",
    },
    {
        "id": "S006",
        "patient_id": "P006",
        "patient_name": "Jackson Lee",
        "age": 52,
        "gender": "Male",
        "days_ago": 0,
        "hour": 10,
        "minute": 0,
        "status": "Pending",
        "prediction_label": "Normal",
        "prediction_confidence": 0.71,
        "image_url": "/placeholder-xray.svg",
        "grad_cam_url": None,
        "notes": "",
        "review_decision": None,
        "final_label": None,
        "review_note": None,
    },
]


def _uploaded_at(days_ago: int, hour: int, minute: int) -> datetime:
    now = datetime.now()
    day = (now - timedelta(days=days_ago)).replace(
        hour=hour, minute=minute, second=0, microsecond=0
    )
    return day


def build_seed_studies() -> list[StudyEntity]:
    studies: list[StudyEntity] = []
    for spec in SEED_SPECS:
        reviewed_at = (
            _uploaded_at(spec["days_ago"], spec["hour"], spec["minute"])
            + timedelta(hours=1)
            if spec["review_decision"]
            else None
        )
        studies.append(
            StudyEntity(
                id=spec["id"],
                patient_id=spec["patient_id"],
                patient_name=spec["patient_name"],
                age=spec["age"],
                gender=spec["gender"],
                modality="Chest X-ray",
                uploaded_at=_uploaded_at(spec["days_ago"], spec["hour"], spec["minute"]),
                status=spec["status"],
                prediction_label=spec["prediction_label"],
                prediction_confidence=spec["prediction_confidence"],
                prediction_findings="[]",
                prediction_mode="nih14",
                image_url=spec["image_url"],
                grad_cam_url=spec["grad_cam_url"],
                notes=spec["notes"],
                review_decision=spec["review_decision"],
                final_label=spec["final_label"],
                review_note=spec["review_note"],
                reviewed_at=reviewed_at,
            )
        )
    return studies


def refresh_seed_upload_dates(db: Session) -> None:
    """Keep seed rows on a rolling timeline and sync NIH-style labels + reviews."""
    for spec in SEED_SPECS:
        entity = db.get(StudyEntity, spec["id"])
        if entity is None:
            continue
        entity.uploaded_at = _uploaded_at(spec["days_ago"], spec["hour"], spec["minute"])
        entity.prediction_label = spec["prediction_label"]
        entity.prediction_confidence = spec["prediction_confidence"]
        entity.prediction_mode = "nih14"
        entity.status = spec["status"]
        entity.review_decision = spec["review_decision"]
        entity.final_label = spec["final_label"]
        entity.review_note = spec["review_note"]
        entity.reviewed_at = (
            entity.uploaded_at + timedelta(hours=1) if spec["review_decision"] else None
        )
        if not getattr(entity, "prediction_findings", None):
            entity.prediction_findings = "[]"
    db.commit()


def seed_studies(db: Session) -> None:
    if db.query(StudyEntity).count() == 0:
        db.add_all(build_seed_studies())
        db.commit()
        return
    refresh_seed_upload_dates(db)
