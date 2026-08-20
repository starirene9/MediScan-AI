from datetime import datetime

from sqlalchemy.orm import Session

from app.models.entities import StudyEntity

SEED_STUDIES = [
    StudyEntity(
        id="S001",
        patient_id="P001",
        patient_name="John Smith",
        age=45,
        gender="Male",
        modality="Chest X-ray",
        uploaded_at=datetime.fromisoformat("2025-08-18T09:30:00"),
        status="Abnormal",
        prediction_label="Nodule",
        prediction_confidence=0.87,
        image_url="/placeholder-xray.svg",
        grad_cam_url="/placeholder-xray.svg",
        notes="",
    ),
    StudyEntity(
        id="S002",
        patient_id="P002",
        patient_name="Emily Johnson",
        age=32,
        gender="Female",
        modality="Chest X-ray",
        uploaded_at=datetime.fromisoformat("2025-08-18T11:15:00"),
        status="Abnormal",
        prediction_label="Pneumonia",
        prediction_confidence=0.92,
        image_url="/placeholder-xray.svg",
        grad_cam_url="/placeholder-xray.svg",
        notes="Follow-up recommended in 2 weeks.",
    ),
    StudyEntity(
        id="S003",
        patient_id="P003",
        patient_name="Robert Williams",
        age=58,
        gender="Male",
        modality="Chest X-ray",
        uploaded_at=datetime.fromisoformat("2025-08-19T08:00:00"),
        status="Normal",
        prediction_label="Normal",
        prediction_confidence=0.95,
        image_url="/placeholder-xray.svg",
        grad_cam_url=None,
        notes="",
    ),
    StudyEntity(
        id="S004",
        patient_id="P004",
        patient_name="Sophia Garcia",
        age=29,
        gender="Female",
        modality="Chest X-ray",
        uploaded_at=datetime.fromisoformat("2025-08-19T14:20:00"),
        status="Pending",
        prediction_label="Other",
        prediction_confidence=0.62,
        image_url="/placeholder-xray.svg",
        grad_cam_url=None,
        notes="",
    ),
    StudyEntity(
        id="S005",
        patient_id="P005",
        patient_name="David Kim",
        age=67,
        gender="Male",
        modality="Chest X-ray",
        uploaded_at=datetime.fromisoformat("2025-08-20T07:45:00"),
        status="Reviewed",
        prediction_label="Nodule",
        prediction_confidence=0.78,
        image_url="/placeholder-xray.svg",
        grad_cam_url="/placeholder-xray.svg",
        notes="Biopsy scheduled.",
    ),
    StudyEntity(
        id="S006",
        patient_id="P006",
        patient_name="Jackson Lee",
        age=52,
        gender="Male",
        modality="Chest X-ray",
        uploaded_at=datetime.fromisoformat("2025-08-20T10:00:00"),
        status="Pending",
        prediction_label="Normal",
        prediction_confidence=0.71,
        image_url="/placeholder-xray.svg",
        grad_cam_url=None,
        notes="",
    ),
]


def seed_studies(db: Session) -> None:
    if db.query(StudyEntity).count() > 0:
        return
    db.add_all(SEED_STUDIES)
    db.commit()
