import json
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.entities import StudyEntity
from app.models.schemas import PathologyFinding, Prediction, Study, StudyCreate, StudyUpdate


def _parse_findings(raw: str | None) -> list[PathologyFinding]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [PathologyFinding.model_validate(item) for item in data]


def _to_schema(entity: StudyEntity) -> Study:
    return Study(
        id=entity.id,
        patientId=entity.patient_id,
        patientName=entity.patient_name,
        age=entity.age,
        gender=entity.gender,
        modality=entity.modality,
        uploadedAt=entity.uploaded_at,
        status=entity.status,  # type: ignore[arg-type]
        prediction=Prediction(
            label=entity.prediction_label,
            confidence=entity.prediction_confidence,
            findings=_parse_findings(getattr(entity, "prediction_findings", None)),
            classificationMode=getattr(entity, "prediction_mode", None) or "nih14",
        ),
        imageUrl=entity.image_url,
        gradCamUrl=entity.grad_cam_url,
        notes=entity.notes,
    )


def list_studies(db: Session) -> list[Study]:
    rows = db.query(StudyEntity).order_by(StudyEntity.uploaded_at.desc()).all()
    return [_to_schema(row) for row in rows]


def get_study(db: Session, study_id: str) -> Study:
    entity = db.get(StudyEntity, study_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")
    return _to_schema(entity)


def create_study(db: Session, payload: StudyCreate) -> Study:
    stamp = datetime.now().strftime("%H%M%S%f")[:10]
    study_id = f"S{stamp}"
    entity = StudyEntity(
        id=study_id,
        patient_id=payload.patientId or f"P{stamp}",
        patient_name=payload.patientName,
        age=payload.age,
        gender=payload.gender,
        modality=payload.modality,
        uploaded_at=datetime.now(),
        status=payload.status,
        prediction_label=payload.prediction.label,
        prediction_confidence=payload.prediction.confidence,
        prediction_findings=json.dumps(
            [f.model_dump() for f in payload.prediction.findings]
        ),
        prediction_mode=payload.prediction.classificationMode,
        image_url=payload.imageUrl,
        grad_cam_url=payload.gradCamUrl,
        notes=payload.notes,
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return _to_schema(entity)


def update_study(db: Session, study_id: str, payload: StudyUpdate) -> Study:
    entity = db.get(StudyEntity, study_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")

    if payload.notes is not None:
        entity.notes = payload.notes
    if payload.status is not None:
        entity.status = payload.status
    if payload.patientName is not None:
        entity.patient_name = payload.patientName
    if payload.age is not None:
        entity.age = payload.age
    if payload.gender is not None:
        entity.gender = payload.gender
    if payload.modality is not None:
        entity.modality = payload.modality

    db.commit()
    db.refresh(entity)
    return _to_schema(entity)


def delete_study(db: Session, study_id: str) -> None:
    entity = db.get(StudyEntity, study_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")
    db.delete(entity)
    db.commit()
