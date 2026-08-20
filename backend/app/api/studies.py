from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.schemas import AnalyzeResponse, Study, StudyCreate, StudyUpdate
from app.services import inference_service, storage_service, study_service

router = APIRouter(prefix="/api/studies", tags=["studies"])


@router.get("", response_model=list[Study])
def list_studies(db: Session = Depends(get_db)) -> list[Study]:
    return study_service.list_studies(db)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_study(
    file: UploadFile = File(...),
    patientName: str = Form("Unknown Patient"),
    notes: str = Form(""),
    saveToWorklist: bool = Form(False),
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    image_url = storage_service.save_upload(file)
    prediction = await inference_service.predict(file.filename or "xray")
    grad_cam_url = inference_service.mock_gradcam_url(image_url, prediction.label)

    study = None
    if saveToWorklist:
        status = "Normal" if prediction.label == "Normal" else "Abnormal"
        study = study_service.create_study(
            db,
            StudyCreate(
                patientName=patientName,
                notes=notes,
                prediction=prediction,
                imageUrl=image_url,
                gradCamUrl=grad_cam_url,
                status=status,
            ),
        )

    return AnalyzeResponse(
        prediction=prediction,
        imageUrl=image_url,
        gradCamUrl=grad_cam_url,
        study=study,
    )


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
