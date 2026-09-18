from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.outreach_draft import OutreachDraft
from app.models.company import Company

from app.services.enrichment_service import (
    EnrichmentService,
    EnrichmentAPIError,
)
from app.api.workspace import _latest_knowledge_for_company, _to_text


router = APIRouter(
    prefix="/enrichment",
    tags=["Enrichment"],
)

enrichment = EnrichmentService()


# ============================================================
# Schemas
# ============================================================

class EmailFinderRequest(BaseModel):
    first_name: str
    last_name: str
    domain: str


class FindAndVerifyRequest(BaseModel):
    first_name: str
    last_name: str
    domain: str


class EmailVerifierRequest(BaseModel):
    email: str


class EmailEnrichRequest(BaseModel):
    email: str


class PhoneEnrichRequest(BaseModel):
    phone_number: str


class LinkedInEnrichRequest(BaseModel):
    url: str
    unlock_emails: bool = False
    unlock_phone: bool = False


# ============================================================
# Routes
# ============================================================

@router.post("/find-email")
def find_email(
    request: EmailFinderRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = enrichment.find_email(
            first_name=request.first_name,
            last_name=request.last_name,
            domain=request.domain,
        )
    except EnrichmentAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No email found for this person/domain",
        )

    return result


@router.post("/find-and-verify-email")
def find_and_verify_email(
    request: FindAndVerifyRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = enrichment.find_and_verify_email(
            first_name=request.first_name,
            last_name=request.last_name,
            domain=request.domain,
        )
    except EnrichmentAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No email found for this person/domain",
        )

    return result


# ============================================================
# Draft-linked enrichment
# ============================================================

def _extract_domain(website: str) -> str:
    """Best-effort extraction of a bare domain from a stored website URL."""

    domain = website.strip()

    for prefix in ("https://", "http://"):
        if domain.startswith(prefix):
            domain = domain[len(prefix):]
            break

    domain = domain.split("/")[0]

    if domain.startswith("www."):
        domain = domain[4:]

    return domain


def _find_contact_linkedin_url(knowledge: dict, stakeholder_name: str) -> str | None:
    """
    Match a draft's stakeholder name against the company's stored
    contacts (captured during research/knowledge extraction) and
    return whatever linkedin_url was found for them, if any.
    """
    if not knowledge:
        return None

    target = stakeholder_name.strip().lower()

    for contact in knowledge.get("contacts", []) or []:
        name = _to_text(contact.get("name", "")).strip().lower()
        if name and name == target:
            url = contact.get("linkedin_url")
            if url:
                return url

    return None


@router.post("/drafts/{draft_id}/find-email")
def find_email_for_draft(
    draft_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = (
        db.query(OutreachDraft)
        .filter(
            OutreachDraft.id == draft_id,
            OutreachDraft.user_id == current_user.id,
        )
        .first()
    )

    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.stakeholder_email and not force:
        return {
            "draft_id": draft.id,
            "stakeholder_name": draft.stakeholder_name,
            "email": draft.stakeholder_email,
            "email_verified": draft.email_verified,
            "mx_domain": draft.email_mx_domain,
            "cached": True,
        }

    if not draft.stakeholder_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Draft has no stakeholder name to look up",
        )

    company = (
        db.query(Company)
        .filter(Company.id == draft.company_id)
        .first()
    )

    if not company or not company.website:
        raise HTTPException(
            status_code=400,
            detail="Company has no website/domain on file",
        )

    name_parts = draft.stakeholder_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    domain = _extract_domain(company.website)

    try:
        result = enrichment.find_and_verify_email(
            first_name=first_name,
            last_name=last_name,
            domain=domain,
        )
    except EnrichmentAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No email found for this stakeholder/domain",
        )

    draft.stakeholder_email = result["email"]
    draft.email_verified = result["is_valid"]
    draft.email_mx_domain = result["mx_domain"]

    db.commit()
    db.refresh(draft)

    return {
        "draft_id": draft.id,
        "stakeholder_name": draft.stakeholder_name,
        "email": draft.stakeholder_email,
        "email_verified": draft.email_verified,
        "mx_domain": draft.email_mx_domain,
        "cached": False,
    }


@router.post("/drafts/{draft_id}/find-email-by-linkedin")
def find_email_for_draft_by_linkedin(
    draft_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Same idea as find_email_for_draft, but sourced from the LinkedIn URL
    already captured for this stakeholder during research (workspace
    knowledge extraction), instead of a name + domain guess. No URL is
    accepted from the caller - it's looked up from stored data so this
    stays a one-click action from the frontend.
    """
    draft = (
        db.query(OutreachDraft)
        .filter(
            OutreachDraft.id == draft_id,
            OutreachDraft.user_id == current_user.id,
        )
        .first()
    )

    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.stakeholder_email and not force:
        return {
            "draft_id": draft.id,
            "stakeholder_name": draft.stakeholder_name,
            "email": draft.stakeholder_email,
            "email_verified": draft.email_verified,
            "mx_domain": draft.email_mx_domain,
            "cached": True,
        }

    if not draft.stakeholder_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Draft has no stakeholder name to look up",
        )

    _, knowledge = _latest_knowledge_for_company(
        db, draft.company_id, current_user.id
    )

    linkedin_url = _find_contact_linkedin_url(knowledge or {}, draft.stakeholder_name)

    if not linkedin_url:
        raise HTTPException(
            status_code=404,
            detail="No LinkedIn URL on file for this stakeholder",
        )

    try:
        result = enrichment.find_and_verify_email_by_linkedin(url=linkedin_url)
    except EnrichmentAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No email found for this LinkedIn profile",
        )

    draft.stakeholder_email = result["email"]
    draft.email_verified = result["is_valid"]
    draft.email_mx_domain = result["mx_domain"]

    db.commit()
    db.refresh(draft)

    return {
        "draft_id": draft.id,
        "stakeholder_name": draft.stakeholder_name,
        "email": draft.stakeholder_email,
        "email_verified": draft.email_verified,
        "mx_domain": draft.email_mx_domain,
        "email_source": result["email_source"],
        "linkedin_url": linkedin_url,
        "cached": False,
    }


@router.post("/drafts/backfill-emails")
def backfill_draft_emails(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    One-time (or occasional) sweep: finds every draft belonging to this
    user that doesn't have an email yet, and attempts to find + verify
    one for each. Skips drafts that already have an email (no wasted
    credits) and skips ones with no usable name/domain.
    """
    drafts = (
        db.query(OutreachDraft)
        .filter(
            OutreachDraft.user_id == current_user.id,
            OutreachDraft.stakeholder_email.is_(None),
        )
        .all()
    )

    results = {
        "total_checked": len(drafts),
        "found": 0,
        "not_found": 0,
        "skipped": 0,
        "errors": 0,
    }

    for draft in drafts:
        if not draft.stakeholder_name.strip():
            results["skipped"] += 1
            continue

        company = (
            db.query(Company)
            .filter(Company.id == draft.company_id)
            .first()
        )

        if not company or not company.website:
            results["skipped"] += 1
            continue

        name_parts = draft.stakeholder_name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        domain = _extract_domain(company.website)

        try:
            result = enrichment.find_and_verify_email(
                first_name=first_name,
                last_name=last_name,
                domain=domain,
            )
        except EnrichmentAPIError:
            results["errors"] += 1
            continue

        if result is None:
            results["not_found"] += 1
            continue

        draft.stakeholder_email = result["email"]
        draft.email_verified = result["is_valid"]
        draft.email_mx_domain = result["mx_domain"]
        results["found"] += 1

    db.commit()

    return results


@router.post("/verify-email")
def verify_email(
    request: EmailVerifierRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        return enrichment.verify_email(email=request.email)
    except EnrichmentAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/email")
def enrich_by_email(
    request: EmailEnrichRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        return enrichment.enrich_by_email(email=request.email)
    except EnrichmentAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/phone")
def enrich_by_phone(
    request: PhoneEnrichRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        return enrichment.enrich_by_phone(phone_number=request.phone_number)
    except EnrichmentAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/linkedin")
def enrich_by_linkedin(
    request: LinkedInEnrichRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        return enrichment.enrich_by_linkedin(
            url=request.url,
            unlock_emails=request.unlock_emails,
            unlock_phone=request.unlock_phone,
        )
    except EnrichmentAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)