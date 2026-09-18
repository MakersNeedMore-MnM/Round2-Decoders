from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from googleapiclient.errors import HttpError

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.analysis_result import AnalysisResult
from app.models.knowledge_source import KnowledgeSource
from app.models.user import User
from app.services.outreach_service import OutreachService
from app.models.connected_account import ConnectedAccount
from app.schemas.send_email import SendEmailRequest
from app.services.gmail_service import GmailService
from app.api.workspace import (
    _applicable_purposes,
    _intent_level,
    _purpose_strategy,
)

router = APIRouter(
    prefix="/queue",
    tags=["Outreach Queue"],
)

service = OutreachService()
gmail_service = GmailService()

def _serialize(draft, company_name: str):
    return {
        "id": str(draft.id),
        "companyId": str(draft.company_id),
        "companyName": company_name,
        "stakeholderName": draft.stakeholder_name,
        "stakeholderEmail": draft.stakeholder_email,
        "emailVerified": draft.email_verified,
        "emailMxDomain": draft.email_mx_domain,
        "channel": draft.channel,
        "subject": draft.subject,
        "body": draft.body,
        "confidence": draft.confidence,
        "reasoning": draft.reasoning,
        "evidence": draft.evidence or [],
        "status": draft.status,
        "createdAt": draft.created_at,
    }


@router.get("/")
async def list_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drafts = service.list_for_user(db, current_user.id)

    return [
        _serialize(d, d.company.name if d.company else "")
        for d in drafts
    ]


@router.post("/generate/{analysis_id}")
async def generate_draft(
    analysis_id: int,
    purpose: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.id == analysis_id,
            AnalysisResult.user_id == current_user.id,
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # If the user explicitly picked an outreach purpose in the UI, resolve
    # it against this account's real evidence (same logic the recommendations
    # preview uses) so the generated draft actually reflects that choice —
    # nothing here invents new evidence, it only selects which already-real
    # signals to lead with.
    purpose_strategy = None
    if purpose:
        knowledge_source = (
            db.query(KnowledgeSource)
            .filter(KnowledgeSource.id == analysis.knowledge_id)
            .first()
        )
        knowledge = (
            (knowledge_source.processed_data.get("knowledge", {}) if knowledge_source else {})
            or {}
        )
        persona = analysis.persona or {}
        decision_maker = persona.get("primary_decision_maker", "") or ""
        pain_points = knowledge.get("pain_points") or []
        buying_signals = knowledge.get("buying_signals") or []
        sources = knowledge.get("sources") or []
        intent_score = (analysis.intent or {}).get("intent_score", 0)
        level = _intent_level(intent_score)
        applicable = _applicable_purposes(
            knowledge, persona, decision_maker, pain_points, buying_signals, sources
        )
        purpose_strategy = _purpose_strategy(
            purpose,
            level,
            analysis.company.name if analysis.company else "",
            decision_maker,
            pain_points,
            buying_signals,
            applicable,
        )

    draft = service.generate_from_analysis(db, current_user, analysis, purpose_strategy=purpose_strategy)

    return _serialize(draft, draft.company.name if draft.company else "")


@router.post("/{draft_id}/approve")
async def approve_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = service.set_status(db, current_user.id, draft_id, "approved")

    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    return _serialize(draft, draft.company.name if draft.company else "")


@router.post("/{draft_id}/reject")
async def reject_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = service.set_status(db, current_user.id, draft_id, "rejected")

    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    return _serialize(draft, draft.company.name if draft.company else "")


@router.post("/{draft_id}/edit")
async def edit_draft(
    draft_id: int,
    subject: str | None = None,
    body: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = service.update_body(db, current_user.id, draft_id, subject, body)

    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    return _serialize(draft, draft.company.name if draft.company else "")

@router.delete("/{draft_id}")
async def delete_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted_id = service.delete(db, current_user.id, draft_id)

    if deleted_id is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    return {
        "success": True,
        "deleted_id": deleted_id,
    }

@router.post("/{draft_id}/send")
async def send_email(
    draft_id: int,
    payload: SendEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    account = (
        db.query(ConnectedAccount)
        .filter(
            ConnectedAccount.user_id == current_user.id,
            ConnectedAccount.provider == "google",
        )
        .first()
    )

    if account is None:
        raise HTTPException(
            status_code=400,
            detail="Gmail not connected",
        )

    try:
        gmail_service.send_email(
            account,
            payload.recipient,
            payload.subject,
            payload.body,
        )
    except HttpError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to send email via Gmail: {e.reason if hasattr(e, 'reason') else str(e)}",
        )

    draft = service.set_status(
        db,
        current_user.id,
        draft_id,
        "approved",
    )

    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    return {
        "success": True,
        "message": "Email sent successfully",
        "draft": _serialize(draft, draft.company.name if draft.company else ""),
    }