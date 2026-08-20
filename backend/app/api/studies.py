from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.schemas import Study, StudyCreate, StudyUpdate
from app.services import study_service

router = APIRouter(prefix="/api/studies", tags=["studies"])


@router.get("", response_model=list[Study])
def list_studies(db: Session = Depends(get_db)) -> list[Study]:
    return study_service.list_studies(db)


@router.get("/{study_id}", response_model=Study)
def get_study(study_id: str, db: Session = Depends(get_db)) -> Study:
    return study_service.get_study(db, study_id)


@router.post("", response_model=Study, status_code=201)
def create_study(payload: StudyCreate, db: Session = Depends(get_db)) -> Study:
    return study_service.create_study(db, payload)


@router.patch("/{study_id}", response_model=Study)
def update_study(
    study_id: str, payload: StudyUpdate, db: Session = Depends(get_db)
) -> Study:
    return study_service.update_study(db, study_id, payload)
