from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.services import chat_service, demo_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post(
    "",
    response_model=ChatResponse,
    dependencies=[Depends(demo_service.limit_chat)],
)
async def clinical_chat(
    payload: ChatRequest, db: Session = Depends(get_db)
) -> ChatResponse:
    return await chat_service.chat(db, payload)
