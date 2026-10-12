"""Clinical assistant chat via Groq (OpenAI-compatible API)."""

from __future__ import annotations

import re

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.schemas import ChatMessage, ChatRequest, ChatResponse, Study
from app.services import study_service

SYSTEM_PROMPT = """You are MediScan AI Clinical Assistant, a decision-support aid for clinicians reviewing chest X-ray AI screening results (NIH ChestX-ray14 style findings).

Hard rules:
- For clinical reference only. You do NOT diagnose, prescribe, or replace professional judgment.
- Never state that a patient is definitely normal or definitely has a disease. Describe what the AI result and clinical review recorded, and use cautious language (possible, consider, correlate clinically).
- You cannot see the X-ray image. Do not describe image appearances for the current study or invent findings that are not in the study context.
- If information is insufficient, say what is missing and suggest correlating with clinical history and radiologist review.
- If asked for emergency advice, urge following local clinical protocols and escalation.

Study identity:
- Patient names are intentionally never shared with you. You only know the studyId in the study context.
- If the user mentions a patient by name, or a study ID different from the one in the context, start by saying you can only see study <studyId> and cannot confirm which patient it belongs to, and ask them to select the correct study in the worklist. Do not answer as if the context belongs to the named patient.
- General medical or imaging questions (definitions, differentials, how findings look on X-ray) never need a study. Answer them normally even when no study is selected.
- Only when the question refers to a specific study or patient (e.g. "this study", "this patient", "this result") and no study is selected, tell them to select a study row in the worklist or open Study Detail first.
- If aiPositiveFindings is "not available", only the primary label was stored for that study. Do not call it a contradiction or system error, and do not mention it unless the user asks about individual findings.

Style:
- Reply in the same language as the user's latest message.
- Be concise: at most about 8 short bullet points or 150 words unless the user asks for more detail. Review note drafts should be 3-5 sentences.
- Use simple Markdown only: short paragraphs, bullet lists, and **bold**. No tables, no headings.
- In Korean, use standard Korean medical terms with the English term in parentheses, e.g. 무기폐(atelectasis), 흉수(pleural effusion), 경화(consolidation), 폐렴(pneumonia), 결절(nodule), 심비대(cardiomegaly), 영상의학과 전문의(radiologist). If unsure of the Korean term, use the English term.
"""

HANGUL = re.compile(r"[\uac00-\ud7a3]")

RATE_LIMIT_DETAIL = "Clinical assistant is busy (rate limit reached). Please try again in a minute."


def is_chat_configured() -> bool:
    return bool(settings.groq_api_key.strip())


def _format_positive_findings(study: Study) -> str:
    findings = study.prediction.findings
    if not findings:
        return "not available"
    positives = [f"{f.name} ({f.score:.2f})" for f in findings if f.positive][:8]
    return ", ".join(positives) if positives else "none above threshold"


def _build_study_context(study: Study) -> str:
    review_line = "not reviewed yet"
    if study.review:
        review_line = f"{study.review.decision}; finalLabel={study.review.finalLabel}"
        if study.review.note.strip():
            review_line += f"; reviewNote={study.review.note.strip()}"
    return (
        "Current study context (patient name withheld; for reference only):\n"
        f"- studyId: {study.id}\n"
        f"- age: {study.age}; gender: {study.gender}; modality: {study.modality}\n"
        f"- worklistStatus: {study.status}\n"
        f"- aiPrimaryLabel: {study.prediction.label} "
        f"(confidence={study.prediction.confidence:.2f}; "
        f"mode={study.prediction.classificationMode})\n"
        f"- aiPositiveFindings: {_format_positive_findings(study)}\n"
        f"- clinicalReview: {review_line}\n"
        f"- clinicianNotes: {(study.notes or '').strip() or 'none'}"
    )


def _normalize_messages(
    messages: list[ChatMessage], study_context: str | None
) -> list[dict[str, str]]:
    out: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    out.append(
        {
            "role": "system",
            "content": study_context
            or "No study is selected. General questions can still be answered.",
        }
    )
    for message in messages:
        if message.role == "system":
            continue
        out.append({"role": message.role, "content": message.content.strip()})
    user_messages = [item for item in out if item["role"] == "user"]
    if not user_messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one user message is required.",
        )
    # The English system prompt and study context pull answers toward English, so the
    # prompt-only "reply in the user's language" rule is not reliable for Korean.
    if HANGUL.search(user_messages[-1]["content"]):
        out.insert(
            len(out) - 1,
            {"role": "system", "content": "Respond in Korean for this turn."},
        )
    return out


def _request_body(model: str, messages: list[dict[str, str]]) -> dict:
    body: dict = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": settings.groq_max_tokens,
    }
    # gpt-oss models spend completion tokens on hidden reasoning; keep it short so
    # the visible answer is not cut off by max_tokens.
    if model.startswith("openai/gpt-oss"):
        body["reasoning_effort"] = "low"
    return body


def _upstream_error_detail(response: httpx.Response) -> str:
    try:
        err = response.json()
        return err.get("error", {}).get("message") or err.get("message") or ""
    except Exception:
        return response.text[:300]


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

    messages = _normalize_messages(payload.messages, study_context)
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key.strip()}",
        "Content-Type": "application/json",
    }
    url = f"{settings.groq_base_url.rstrip('/')}/chat/completions"

    response: httpx.Response | None = None
    try:
        async with httpx.AsyncClient(timeout=settings.groq_timeout_seconds) as client:
            for model in settings.groq_model_chain:
                response = await client.post(
                    url, headers=headers, json=_request_body(model, messages)
                )
                if response.status_code != status.HTTP_429_TOO_MANY_REQUESTS:
                    break
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

    if response is None or response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=RATE_LIMIT_DETAIL,
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_upstream_error_detail(response) or "Clinical assistant request failed.",
        )

    data = response.json()
    try:
        content = (data["choices"][0]["message"]["content"] or "").strip()
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
