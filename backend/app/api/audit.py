from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.analysis_result import AnalysisResult
from app.models.user import User


def _relative_time(when: datetime) -> str:
    delta = datetime.utcnow() - when
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return f"{max(seconds, 0)}s ago"
    if seconds < 3600:
        return f"{seconds // 60} min ago"
    if seconds < 86400:
        return f"{seconds // 3600}h ago"
    return f"{seconds // 86400}d ago"

router = APIRouter(
    prefix="/audit",
    tags=["Audit"],
)

STATUS_BY_TYPE = {
    "Knowledge": "info",
    "Persona": "success",
    "Intent": "success",
    "Strategy": "success",
    "Guardrail": "warning",
}

ICON_BY_TYPE = {
    "Knowledge": "📄",
    "Persona": "👤",
    "Intent": "📈",
    "Strategy": "🎯",
    "Guardrail": "🛡️",
}

AGENT_BY_TYPE = {
    "Knowledge": "Orchestrator",
    "Persona": "PersonaAgent",
    "Intent": "IntentAgent",
    "Strategy": "StrategyAI",
    "Guardrail": "GuardrailAgent",
}


@router.get("/")
async def list_audit_events(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Every agent-run event across every company the user has analyzed,
    newest first. Built from analysis_results so it stays in sync with
    what actually ran, rather than a separate log table that could drift.
    """

    analyses = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.user_id == current_user.id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(limit)
        .all()
    )

    events = []

    for analysis in analyses:

        company_name = analysis.company.name if analysis.company else "Unknown"

        guardrail = analysis.guardrail or {}
        intent = analysis.intent or {}
        strategy = analysis.strategy or {}
        persona = analysis.persona or {}

        base_id = f"analysis-{analysis.id}"

        entries = [
            (
                "Knowledge",
                "Analysis Started",
                f"Ran the full pipeline for {company_name}.",
            ),
            (
                "Persona",
                "Decision Maker Identified",
                persona.get("primary_decision_maker") or "No decision maker identified.",
            ),
            (
                "Intent",
                "Buying Intent Scored",
                f'Intent score: {intent.get("intent_score", 0)} · {intent.get("priority", "")} priority',
            ),
            (
                "Strategy",
                "Next Best Action Generated",
                strategy.get("next_best_action") or "No action generated.",
            ),
            (
                "Guardrail",
                "Unsupported Claim Blocked" if guardrail.get("unsupported_claims") else "Guardrail Check Passed",
                guardrail.get("reasoning") or f'Risk level: {guardrail.get("risk_level", "Unknown")}',
            ),
        ]

        for i, (event_type, title, detail) in enumerate(entries):
            events.append(
                {
                    "id": f"{base_id}-{i}",
                    "event": title,
                    "agent": AGENT_BY_TYPE[event_type],
                    "time": _relative_time(analysis.created_at),
                    "timestamp": analysis.created_at,
                    "detail": f"[{company_name}] {detail}",
                    "status": (
                        "warning"
                        if event_type == "Guardrail" and guardrail.get("unsupported_claims")
                        else STATUS_BY_TYPE[event_type]
                    ),
                }
            )

    events.sort(key=lambda e: e["timestamp"], reverse=True)

    return events