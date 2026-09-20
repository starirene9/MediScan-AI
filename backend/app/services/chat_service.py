"""Clinical assistant chat via Groq (OpenAI-compatible API)."""

from __future__ import annotations

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.schemas import ChatMessage, ChatRequest, ChatResponse, Study
from app.services import study_service

SYSTEM_PROMPT = """You are MediScan AI Clinical Assistant, a decision-support aid for clinicians reviewing chest X-ray AI screening results (NIH ChestX-ray14 style findings).

Hard rules:
- For clinical reference only. You do NOT diagnose, prescribe, or replace professional judgment.
- Never claim certainty of disease. Prefer cautious language (possible, consider, correlate clinically).
- Do not invent imaging findings that are not in the provided study context.
- If information is insufficient, say what is missing and suggest correlating with clinical history and radiologist review.
- Keep answers concise and structured unless the user asks for detail.
- If asked for emergency advice, urge following local clinical protocols and escalation.
"""


def is_chat_configured() -> bool:
    return bool(settings.groq_api_key.strip())


def _build_study_context(study: Study) -> str:
    positives = [
        f"{f.name} ({f.score:.2f})"
        for f in study.prediction.findings
        if f.positive
    ][:8]
    review_line = "none"
    if study.review:
        review_line = (
            f"{study.review.decision}; finalLabel={study.review.finalLabel}"
        )
    return (
        "Current study context (no patient name; for reference only):\n"
        f"- studyId: {study.id}\n"
        f"- age: {study.age}; gender: {study.gender}; modality: {study.modality}\n"
        f"- worklistStatus: {study.status}\n"
        f"- aiPrimaryLabel: {study.prediction.label} "
        f"(confidence={study.prediction.confidence:.2f}; "
        f"mode={study.prediction.classificationMode})\n"
        f"- aiPositiveFindings: {', '.join(positives) if positives else 'none'}\n"
        f"- clinicalReview: {review_line}\n"
        f"- clinicianNotes: {(study.notes or '').strip() or 'none'}"
    )


def _normalize_messages(
    messages: list[ChatMessage], study_context: str | None
) -> list[dict[str, str]]:
    out: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if study_context:
        out.append(
            {
                "role": "system",
                "content": study_context,
            }
        )
    for message in messages:
        if message.role == "system":
            continue
        out.append({"role": message.role, "content": message.content.strip()})
    if not any(item["role"] == "user" for item in out):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one user message is required.",
        )
    return out


async def chat(db: Session, payload: ChatRequest) -> ChatResponse:
    if not is_chat_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clinical assistant is not configured (missing GROQ_API_KEY).",
        )

    study_id = payload.studyId
    study_context: str | None = None
    if study_id:
        study = study_service.get_study(db, study_id)
        study_context = _build_study_context(study)

    body = {
        "model": settings.groq_model,
        "messages": _normalize_messages(payload.messages, study_context),
        "temperature": 0.3,
        "max_tokens": 800,
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key.strip()}",
        "Content-Type": "application/json",
    }
    url = f"{settings.groq_base_url.rstrip('/')}/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=settings.groq_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=body)
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Clinical assistant timed out. Please try again.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Clinical assistant upstream request failed.",
        ) from exc

    if response.status_code >= 400:
        detail = "Clinical assistant request failed."
        try:
            err = response.json()
            detail = (
                err.get("error", {}).get("message")
                or err.get("message")
                or detail
            )
        except Exception:
            detail = response.text[:300] or detail
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        )

    data = response.json()
    try:
        content = data["choices"][0]["message"]["content"].strip()
        model = data.get("model") or settings.groq_model
    except (KeyError, IndexError, AttributeError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Clinical assistant returned an unexpected response.",
        ) from exc

    if not content:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Clinical assistant returned an empty response.",
        )

    return ChatResponse(
        message=ChatMessage(role="assistant", content=content),
        model=model,
        studyId=study_id,
    )
