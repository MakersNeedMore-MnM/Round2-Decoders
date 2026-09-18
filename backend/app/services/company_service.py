from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.analysis_result import AnalysisResult
from app.models.knowledge_source import KnowledgeSource
from app.models.outreach_draft import OutreachDraft


class CompanyService:

    def get_or_create(
        self,
        db: Session,
        name: str,
        website: str = "",
        industry: str = "",
    ) -> Company:

        company = (
            db.query(Company)
            .filter(
                Company.name == name
            )
            .first()
        )

        if company:
            return company

        company = Company(
            name=name,
            website=website,
            industry=industry,
        )

        db.add(company)
        db.commit()
        db.refresh(company)

        return company

    def delete_research(
        self,
        db: Session,
        user_id: int,
        company_id: int,
    ) -> bool:
        """
        Deletes everything this user has researched about a company:
        outreach drafts, analyses, and the knowledge extracted for
        those analyses. Only removes data scoped to this user — if
        another user also has analyses on the same Company row (a
        shared company record), their data and the Company row itself
        are left untouched.

        Returns False if this user has no research on this company at
        all (nothing to delete). Returns True otherwise.
        """

        analyses = (
            db.query(AnalysisResult)
            .filter(
                AnalysisResult.company_id == company_id,
                AnalysisResult.user_id == user_id,
            )
            .all()
        )

        if not analyses:
            return False

        knowledge_ids = {a.knowledge_id for a in analyses}
        analysis_ids = [a.id for a in analyses]

        # 1. Outreach drafts referencing this company for this user.
        db.query(OutreachDraft).filter(
            OutreachDraft.company_id == company_id,
            OutreachDraft.user_id == user_id,
        ).delete(synchronize_session=False)

        # 2. The analyses themselves.
        db.query(AnalysisResult).filter(
            AnalysisResult.id.in_(analysis_ids),
        ).delete(synchronize_session=False)

        # 3. Knowledge sources, but only ones no longer referenced by
        #    any remaining analysis (defensive — in this app each
        #    knowledge source currently belongs to exactly one
        #    analysis, but this avoids ever deleting shared data).
        for knowledge_id in knowledge_ids:
            still_referenced = (
                db.query(AnalysisResult)
                .filter(AnalysisResult.knowledge_id == knowledge_id)
                .first()
            )
            if not still_referenced:
                db.query(KnowledgeSource).filter(
                    KnowledgeSource.id == knowledge_id,
                    KnowledgeSource.user_id == user_id,
                ).delete(synchronize_session=False)

        # 4. Drop the Company row itself only if no other user (or
        #    stale reference) still points at it.
        still_used = (
            db.query(AnalysisResult)
            .filter(AnalysisResult.company_id == company_id)
            .first()
        )
        if not still_used:
            db.query(Company).filter(Company.id == company_id).delete(
                synchronize_session=False
            )

        db.commit()

        return True