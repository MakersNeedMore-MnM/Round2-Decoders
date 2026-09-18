from sqlalchemy.orm import Session

from app.models.analysis_result import AnalysisResult


class AnalysisService:

    def save(
        self,
        db,
        user_id,
        company_id,
        knowledge_id,
        persona,
        intent,
        strategy,
        guardrail,
        overall_assessment,
        timeline,
        execution,
    ):

        result = AnalysisResult(
            user_id=user_id,
            company_id=company_id,
            knowledge_id=knowledge_id,
            persona=persona,
            intent=intent,
            strategy=strategy,
            guardrail=guardrail,
            overall_assessment=overall_assessment,
            timeline=timeline,
            execution=execution,
        )

        db.add(result)
        db.commit()
        db.refresh(result)

        return result