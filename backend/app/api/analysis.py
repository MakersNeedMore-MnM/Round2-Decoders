from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.analysis_result import AnalysisResult
from app.models.knowledge_source import KnowledgeSource
from app.models.user import User

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)


# ============================================================
# Analysis History
# ============================================================

@router.get("/history")
async def history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.user_id == current_user.id
        )
        .order_by(
            AnalysisResult.created_at.desc()
        )
        .all()
    )

    results = []

    for analysis in analyses:

        results.append(
            {
                "analysis_id": analysis.id,
                "knowledge_id": analysis.knowledge_id,
                "overall_assessment": analysis.overall_assessment,
                "created_at": analysis.created_at,
            }
        )

    return results

# ============================================================
# Recent Analysis
# ============================================================

@router.get("/latest")
async def latest_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analysis = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.user_id == current_user.id
        )
        .order_by(
            AnalysisResult.created_at.desc()
        )
        .first()
    )

    if analysis is None:
        return {
            "message": "No analysis found"
        }

    return {
        "analysis_id": analysis.id,
        "overall_assessment": analysis.overall_assessment,
        "created_at": analysis.created_at,
    }


# ============================================================
# Get Single Analysis
# ============================================================

@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: int,
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
        return {
            "error": "Analysis not found"
        }

    knowledge = (
        db.query(KnowledgeSource)
        .filter(
            KnowledgeSource.id == analysis.knowledge_id
        )
        .first()
    )

    return {
        "analysis_id": analysis.id,
        "overall_assessment": analysis.overall_assessment,
        "knowledge_id": analysis.knowledge_id,
        "knowledge": (
            knowledge.processed_data
            if knowledge
            else {}
        ),
        "persona": analysis.persona,
        "intent": analysis.intent,
        "strategy": analysis.strategy,
        "guardrail": analysis.guardrail,
        "timeline": analysis.timeline,
        "execution": analysis.execution,
        "created_at": analysis.created_at,
    }


# ============================================================
# Delete Analysis
# ============================================================

@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
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
        return {
            "error": "Analysis not found"
        }

    db.delete(analysis)
    db.commit()

    return {
        "message": "Analysis deleted successfully"
    }


# ============================================================
# Dashboard Statistics
# ============================================================

@router.get("/stats/dashboard")
async def dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.user_id == current_user.id
        )
        .all()
    )

    total = len(analyses)

    high_priority = sum(
        1
        for analysis in analyses
        if analysis.intent.get(
            "priority",
            ""
        ) == "High"
    )

    approved = sum(
        1
        for analysis in analyses
        if analysis.guardrail.get(
            "approved",
            False
        )
    )

    average_intent = (
        sum(
            analysis.intent.get(
                "intent_score",
                0
            )
            for analysis in analyses
        ) / total
        if total
        else 0
    )

    average_execution_time = (
        sum(
            analysis.execution.get(
                "total_time_ms",
                0
            )
            for analysis in analyses
        ) / total
        if total
        else 0
    )

    return {
        "total_analyses": total,
        "high_priority": high_priority,
        "approved_analyses": approved,
        "average_intent_score": round(
            average_intent,
            2,
        ),
        "average_execution_time_ms": round(
            average_execution_time,
            2,
        ),
    }


