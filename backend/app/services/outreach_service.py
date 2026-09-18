import re

from sqlalchemy.orm import Session

from app.models.analysis_result import AnalysisResult
from app.models.outreach_draft import OutreachDraft
from app.models.company import Company
from app.models.user import User

from app.core.logger import logger


# Matches the bracketed placeholders LLM-generated drafts commonly leave
# in, e.g. "Dear [Name]," or "Best regards, [Your Name]". Grouped so we
# can tell a "who's this email addressed to" placeholder apart from a
# "who's this email signed by" placeholder and fill each correctly.
_RECIPIENT_PLACEHOLDER = re.compile(
    r"\[\s*(?:First\s+)?(?:Name|Recipient(?:\s+Name)?|Contact(?:\s+Name)?)\s*\]",
    re.IGNORECASE,
)
_SENDER_PLACEHOLDER = re.compile(
    r"\[\s*(?:Your|Sender)\s+Name\s*\]",
    re.IGNORECASE,
)

def _display_name_from_username(username: str) -> str:
    """
    Usernames like 'gaurav21' aren't fit to sign an email with. Strips
    trailing digits and title-cases what's left, so 'gaurav21' becomes
    'Gaurav'. Falls back to the raw username if nothing sensible remains.
    """
    if not username:
        return ""

    cleaned = re.sub(r"\d+$", "", username).strip()
    return cleaned.title() if cleaned else username

def _personalize(text: str, recipient_name: str, sender_name: str) -> str:
    """
    Replaces generic bracketed placeholders the LLM leaves in drafts
    with the real stakeholder's first name and the real sending user's
    name, so a draft never goes out literally addressed to "[Name]".
    """
    if not text:
        return text

    recipient_first = (recipient_name or "").strip().split(" ")[0] or "there"
    sender = (sender_name or "").strip() or "The Team"

    text = _RECIPIENT_PLACEHOLDER.sub(recipient_first, text)
    text = _SENDER_PLACEHOLDER.sub(sender, text)

    return text


class OutreachService:
    """
    Turns an approved analysis (persona + strategy + guardrail) into a
    grounded, editable outreach draft that a human reviews before it can
    be marked approved. Nothing here sends anything — this only manages
    the draft's lifecycle in the database.
    """

    def generate_from_analysis(
        self,
        db: Session,
        current_user: User,
        analysis: AnalysisResult,
        purpose_strategy: dict | None = None,
    ) -> OutreachDraft:

        persona = analysis.persona or {}
        strategy = analysis.strategy or {}
        guardrail = analysis.guardrail or {}

        stakeholder_name = persona.get("primary_decision_maker", "") or "Unknown contact"

        next_action = strategy.get("next_best_action", "") or "Follow up"

        subject = (
            strategy.get("email_subject")
            or strategy.get("account_summary", "")
            or f"Following up: {next_action}"
        )
        if len(subject) > 120:
            subject = subject[:117] + "..."

        body = strategy.get("email_body") or next_action
        if isinstance(body, list):
            body = "\n".join(str(item) for item in body)
        if not body:
            body = next_action

        # A purpose the user explicitly selected in the UI (e.g. "Product
        # Demo" vs "Strategic Partnership") re-frames the opening line and
        # subject around that purpose — using only the same real evidence
        # already backing this account, never inventing anything new.
        if purpose_strategy and not purpose_strategy.get("insufficient_evidence"):
            purpose_name = purpose_strategy.get("name")
            purpose_description = purpose_strategy.get("description")
            if purpose_name:
                subject = f"{purpose_strategy.get('purpose_label', purpose_name)}: {subject}"
                if len(subject) > 120:
                    subject = subject[:117] + "..."
            if purpose_description:
                body = f"{purpose_description}\n\n{body}"

        sender_display_name = _display_name_from_username(current_user.username)

        subject = _personalize(str(subject), stakeholder_name, sender_display_name)
        body = _personalize(str(body), stakeholder_name, sender_display_name)

        evidence = guardrail.get("supported_claims", []) or []

        draft = OutreachDraft(
            user_id=current_user.id,
            company_id=analysis.company_id,
            analysis_id=analysis.id,
            stakeholder_name=stakeholder_name,
            channel="email",
            subject=str(subject),
            body=str(body),
            confidence=int(guardrail.get("confidence", 0) or 0),
            reasoning=str(guardrail.get("reasoning", "")),
            evidence=evidence,
            status="pending",
        )

        db.add(draft)
        db.commit()
        db.refresh(draft)

        self._try_auto_enrich_email(db, draft)

        return draft


    def _try_auto_enrich_email(
        self,
        db: Session,
        draft: OutreachDraft,
    ) -> None:
        """
        Best-effort: try to find + verify the stakeholder's email right
        when the draft is created, so it's already sitting in the DB by
        the time the person opens the queue. Never blocks or fails draft
        creation — any error here is logged and swallowed.
        """
        if not draft.stakeholder_name or draft.stakeholder_name == "Unknown contact":
            return

        company = (
            db.query(Company)
            .filter(Company.id == draft.company_id)
            .first()
        )

        if not company or not company.website:
            return

        try:
            # Local import to avoid a hard circular dependency between
            # services; enrichment_service has no dependency back on this
            # module, so this is just keeping the import surface small.
            from app.api.enrichment import _extract_domain
            from app.services.enrichment_service import (
                EnrichmentService,
                EnrichmentAPIError,
            )

            name_parts = draft.stakeholder_name.strip().split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            domain = _extract_domain(company.website)

            result = EnrichmentService().find_and_verify_email(
                first_name=first_name,
                last_name=last_name,
                domain=domain,
            )

            if result is not None:
                draft.stakeholder_email = result["email"]
                draft.email_verified = result["is_valid"]
                draft.email_mx_domain = result["mx_domain"]
                db.commit()
                db.refresh(draft)

        except EnrichmentAPIError as e:
            logger.warning(
                f"Auto email enrichment failed for draft {draft.id}: {e.message}"
            )
        except Exception as e:
            logger.warning(
                f"Auto email enrichment error for draft {draft.id}: {e}"
            )

    def list_for_user(self, db: Session, user_id: int):
        return (
            db.query(OutreachDraft)
            .filter(OutreachDraft.user_id == user_id)
            .order_by(OutreachDraft.created_at.desc())
            .all()
        )

    def get(self, db: Session, user_id: int, draft_id: int):
        return (
            db.query(OutreachDraft)
            .filter(
                OutreachDraft.id == draft_id,
                OutreachDraft.user_id == user_id,
            )
            .first()
        )

    def set_status(
        self,
        db: Session,
        user_id: int,
        draft_id: int,
        status: str,
    ):
        draft = self.get(db, user_id, draft_id)

        if draft is None:
            return None

        draft.status = status
        db.commit()
        db.refresh(draft)

        return draft

    def update_body(
        self,
        db: Session,
        user_id: int,
        draft_id: int,
        subject: str | None = None,
        body: str | None = None,
    ):
        draft = self.get(db, user_id, draft_id)

        if draft is None:
            return None

        if subject is not None:
            draft.subject = subject

        if body is not None:
            draft.body = body

        draft.status = "edited"

        db.commit()
        db.refresh(draft)

        return draft
    
    def delete(self, db: Session, user_id: int, draft_id: int):
        draft = self.get(db, user_id, draft_id)

        if draft is None:
            return None

        db.delete(draft)
        db.commit()

        return draft_id