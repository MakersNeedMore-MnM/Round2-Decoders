from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.analysis_result import AnalysisResult
from app.models.company import Company
from app.models.user import User
from statistics import mean
from app.models.knowledge_source import KnowledgeSource
from app.services.company_service import CompanyService
import re

router = APIRouter(
    prefix="/workspace",
    tags=["Workspace"],
)

company_service = CompanyService()


INTENT_HIGH_THRESHOLD = 80
INTENT_MEDIUM_THRESHOLD = 60


OUTREACH_PURPOSES = {
    "sales": {
        "label": "Sales / Business Opportunity",
        "focus": "business-value / solution-focused outreach",
    },
    "product_demo": {
        "label": "Product Demo",
        "focus": "demo / discovery-focused outreach",
    },
    "collaboration": {
        "label": "Collaboration",
        "focus": "collaboration-focused outreach",
    },
    "strategic_partnership": {
        "label": "Strategic Partnership",
        "focus": "partnership-focused outreach",
    },
    "sponsorship": {
        "label": "Sponsorship",
        "focus": "sponsorship-focused outreach",
    },
    "event_community": {
        "label": "Event / Community",
        "focus": "event/community-focused outreach",
    },
    "media_pr": {
        "label": "Media / PR",
        "focus": "media/PR-focused outreach",
    },
    "decision_maker_intro": {
        "label": "Decision-Maker Introduction",
        "focus": "a concise executive introduction",
    },
    "followup_nurture": {
        "label": "Follow-up / Nurture",
        "focus": "relationship-building follow-up",
    },
}

_PURPOSE_EVIDENCE_KEYWORDS = {
    "collaboration": ["collaborat", "co-build", "joint", "integration partner"],
    "strategic_partnership": ["partner", "partnership", "alliance"],
    "sponsorship": ["sponsor", "sponsorship"],
    "event_community": ["event", "conference", "summit", "community", "meetup"],
    "media_pr": ["media", "press", "pr ", "publicity", "announcement", "coverage"],
}


def _evidence_text(knowledge: dict, sources: list) -> str:
    """Concatenates the real extracted text this account already has —
    never fetches or invents anything new — purely so keyword gating
    below has something real to check against."""
    parts = [
        knowledge.get("industry", "") or "",
        " ".join(knowledge.get("pain_points") or []),
        " ".join(knowledge.get("buying_signals") or []),
        " ".join((s.get("title", "") if isinstance(s, dict) else "") for s in sources),
    ]
    return " ".join(parts).lower()


def _applicable_purposes(
    knowledge: dict,
    persona: dict,
    decision_maker: str,
    pain_points: list,
    buying_signals: list,
    sources: list,
) -> list[str]:
   
    applicable = []
    has_any_evidence = bool(pain_points or buying_signals or sources)

    if has_any_evidence:
        applicable.append("sales")
    if pain_points or buying_signals:
        applicable.append("product_demo")
    if decision_maker:
        applicable.append("decision_maker_intro")
    if has_any_evidence:
        applicable.append("followup_nurture")

    text = _evidence_text(knowledge, sources)
    for key, keywords in _PURPOSE_EVIDENCE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            applicable.append(key)

    return applicable


def _purpose_strategy(
    purpose_key: str,
    level: str,
    company_name: str,
    decision_maker: str,
    pain_points: list,
    buying_signals: list,
    applicable_purposes: list[str],
) -> dict:
   
    purpose = OUTREACH_PURPOSES.get(purpose_key)

    if purpose is None:
        return {
            "purpose": purpose_key,
            "insufficient_evidence": True,
            "message": "Unknown outreach purpose.",
        }

    if purpose_key not in applicable_purposes:
        return {
            "purpose": purpose_key,
            "purpose_label": purpose["label"],
            "insufficient_evidence": True,
            "message": "Insufficient evidence for this outreach type.",
        }

    if level == "HIGH":
        posture = "Direct, personalized"
        grounding = f"to {decision_maker}" if decision_maker else "to the identified stakeholder"
    elif level == "MEDIUM":
        posture = "Evidence-first, discovery-oriented"
        grounding = "opening a conversation before pitching"
    else:
        posture = "Soft, low-pressure"
        grounding = "a light-touch signal rather than a pitch"

    name = f"{posture} {purpose['label'].lower()} outreach"
    description = f"{posture} {purpose['focus']} for {company_name}, {grounding}."

    return {
        "purpose": purpose_key,
        "purpose_label": purpose["label"],
        "insufficient_evidence": False,
        "name": name,
        "description": description,
    }

STRATEGY_OPTIONS_BY_LEVEL = {
    "HIGH": [
        {
            "key": "direct",
            "name": "Direct Outreach",
            "description": "Reach out now with a direct, tailored pitch — intent signals are strong enough to skip discovery.",
        },
        {
            "key": "executive",
            "name": "Executive / Decision-Maker Outreach",
            "description": "Go straight to the identified decision-maker with an executive-level message.",
        },
        {
            "key": "pain_point",
            "name": "Pain-Point Outreach",
            "description": "Lead with the specific pain point(s) evidence shows this account is facing.",
        },
    ],
    "MEDIUM": [
        {
            "key": "discovery",
            "name": "Discovery Outreach",
            "description": "Open a conversation to learn more before pitching — intent is real but not yet fully formed.",
        },
        {
            "key": "nurture",
            "name": "Nurture Outreach",
            "description": "Share relevant insight or content to build trust while intent develops further.",
        },
        {
            "key": "evidence_first",
            "name": "Evidence-First Outreach",
            "description": "Lead with the specific evidence found (news, hiring, product signals) rather than a pitch.",
        },
    ],
    "LOW": [
        {
            "key": "monitor",
            "name": "Monitor",
            "description": "No strong buying signals yet — track this account for changes rather than reaching out.",
        },
        {
            "key": "soft_awareness",
            "name": "Soft Awareness",
            "description": "A light-touch, non-salesy touchpoint to stay on the account's radar.",
        },
        {
            "key": "wait",
            "name": "Wait for Signal",
            "description": "Hold off on outreach entirely until a stronger buying signal appears.",
        },
    ],
}


def _intent_level(intent_score: int | float) -> str:
    """Maps the EXISTING Intent Agent score to HIGH/MEDIUM/LOW. No new score."""
    score = intent_score or 0
    if score >= INTENT_HIGH_THRESHOLD:
        return "HIGH"
    if score >= INTENT_MEDIUM_THRESHOLD:
        return "MEDIUM"
    return "LOW"


def _select_strategy_key(
    level: str,
    knowledge: dict,
    persona: dict,
) -> str:
    """
    Picks which of the tier's strategy options best fits this specific
    account, based only on real, already-extracted fields — never
    invents a new field to decide on.
    """
    decision_maker = knowledge.get("decision_makers") or persona.get("primary_decision_maker")
    pain_points = knowledge.get("pain_points") or []
    buying_signals = knowledge.get("buying_signals") or []
    sources = knowledge.get("sources") or []

    if level == "HIGH":
        if decision_maker:
            return "executive"
        if pain_points:
            return "pain_point"
        return "direct"

    if level == "MEDIUM":
        if len(sources) >= 2 or len(pain_points) >= 1:
            return "evidence_first"
        if buying_signals:
            return "discovery"
        return "nurture"

    # LOW
    if not buying_signals and not pain_points:
        return "wait"
    return "soft_awareness" if len(buying_signals) < 2 else "monitor"


def _strategy_options_for(level: str, selected_key: str) -> list[dict]:
    options = STRATEGY_OPTIONS_BY_LEVEL.get(level, [])
    return [
        {**opt, "recommended": opt["key"] == selected_key}
        for opt in options
    ]


@router.get("/")
async def workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    companies = (
        db.query(Company)
        .join(AnalysisResult)
        .filter(
            AnalysisResult.user_id == current_user.id
        )
        .group_by(Company.id)
        .all()
    )

    # Single bulk query instead of one query per company (N+1) — this is
    # what was making the page take 10-15s with more than a handful of
    # accounts, since each extra query is a full network round trip to
    # the database.
    all_analyses = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.user_id == current_user.id)
        .order_by(AnalysisResult.created_at.desc())
        .all()
    )

    analyses_by_company: dict[int, list[AnalysisResult]] = defaultdict(list)
    for analysis in all_analyses:
        analyses_by_company[analysis.company_id].append(analysis)

    response = []

    for company in companies:

        analyses = analyses_by_company.get(company.id, [])

        if not analyses:
            continue

        total = len(analyses)

        latest = analyses[0]

        response.append(
            {
                "company_id": company.id,
                "company": company.name,
                "website": company.website,
                "industry": company.industry,
                "total_analyses": total,
                "last_analysis": latest.created_at,
                "latest_intent": latest.intent.get(
                    "intent_score",
                    0,
                ),
                "priority": latest.intent.get(
                    "priority",
                    "",
                ),
            }
        )

    return response
@router.get("/stats")
async def workspace_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregate real numbers for the Accounts dashboard: the four stat
    cards (total accounts, avg trust score, guardrail catches,
    stakeholders mapped) and the four charts (research status donut,
    pain points by industry, research activity over time, trust score
    distribution). Everything here is derived from this user's actual
    companies/analyses/knowledge — nothing hardcoded.
    """

    companies = (
        db.query(Company)
        .join(AnalysisResult)
        .filter(AnalysisResult.user_id == current_user.id)
        .distinct()
        .all()
    )

    all_analyses = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.user_id == current_user.id)
        .order_by(AnalysisResult.created_at.asc())
        .all()
    )

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

   
    latest_by_company: dict[int, AnalysisResult] = {}
    first_created_by_company: dict[int, datetime] = {}

    for analysis in all_analyses:
        latest_by_company[analysis.company_id] = analysis
        first_created_by_company.setdefault(analysis.company_id, analysis.created_at)

    total_accounts = len(companies)
    new_accounts_this_week = sum(
        1 for created in first_created_by_company.values() if created >= week_ago
    )

    trust_scores = [
        latest_by_company[c.id].intent.get("intent_score", 0) or 0
        for c in companies
        if c.id in latest_by_company
    ]
    avg_trust_score = round(mean(trust_scores)) if trust_scores else 0

    recent_scores = [
        a.intent.get("intent_score", 0) or 0
        for a in all_analyses
        if a.created_at >= week_ago
    ]
    prior_scores = [
        a.intent.get("intent_score", 0) or 0
        for a in all_analyses
        if two_weeks_ago <= a.created_at < week_ago
    ]
    trust_score_delta = (
        round(mean(recent_scores) - mean(prior_scores), 1)
        if recent_scores and prior_scores
        else None
    )

    guardrail_catches = sum(
        1 for a in all_analyses if not a.guardrail.get("approved", True)
    )
    guardrail_catches_this_week = sum(
        1
        for a in all_analyses
        if not a.guardrail.get("approved", True) and a.created_at >= week_ago
    )

  
    status_counts = {"analyzed": 0, "in-review": 0, "queued": 0}
    industry_pain_counts: dict[str, int] = defaultdict(int)
    trust_buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    stakeholders_mapped = 0

    needed_knowledge_ids = {
        latest_by_company[c.id].knowledge_id
        for c in companies
        if c.id in latest_by_company
    }
    knowledge_by_id: dict[int, dict] = {}
    if needed_knowledge_ids:
        knowledge_sources = (
            db.query(KnowledgeSource)
            .filter(KnowledgeSource.id.in_(needed_knowledge_ids))
            .all()
        )
        knowledge_by_id = {
            ks.id: (ks.processed_data.get("knowledge", {}) or {}) for ks in knowledge_sources
        }

    for company in companies:
        latest = latest_by_company.get(company.id)

        if latest is None:
            status_counts["queued"] += 1
            continue

        status_counts["analyzed" if latest.guardrail.get("approved", True) else "in-review"] += 1

        score = latest.intent.get("intent_score", 0) or 0
        if score <= 20:
            bucket_label = "0-20"
        elif score <= 40:
            bucket_label = "21-40"
        elif score <= 60:
            bucket_label = "41-60"
        elif score <= 80:
            bucket_label = "61-80"
        else:
            bucket_label = "81-100"
        trust_buckets[bucket_label] += 1

        knowledge = knowledge_by_id.get(latest.knowledge_id, {})

        pain_points = knowledge.get("pain_points", []) or []
        industry = company.industry or "Unknown"
        industry_pain_counts[industry] += len(pain_points)

        contacts = knowledge.get("contacts", []) or []
        if not contacts:
            contacts = knowledge.get("decision_makers", []) or []
        stakeholders_mapped += len(contacts)

    activity_by_day: dict[str, int] = defaultdict(int)
    for analysis in all_analyses:
        activity_by_day[analysis.created_at.date().isoformat()] += 1

    last_14_days = [(now - timedelta(days=i)).date().isoformat() for i in range(13, -1, -1)]
    research_activity = [
        {"date": day, "analyses": activity_by_day.get(day, 0)} for day in last_14_days
    ]

    top_industries = sorted(
        industry_pain_counts.items(), key=lambda kv: kv[1], reverse=True
    )[:6]

    return {
        "total_accounts": total_accounts,
        "new_accounts_this_week": new_accounts_this_week,
        "avg_trust_score": avg_trust_score,
        "trust_score_delta": trust_score_delta,
        "guardrail_catches": guardrail_catches,
        "guardrail_catches_this_week": guardrail_catches_this_week,
        "stakeholders_mapped": stakeholders_mapped,
        "research_status": [
            {"status": status, "count": count} for status, count in status_counts.items()
        ],
        "pain_points_by_industry": [
            {"industry": industry, "count": count} for industry, count in top_industries
        ],
        "research_activity": research_activity,
        "trust_distribution": [
            {"bucket": bucket, "count": count} for bucket, count in trust_buckets.items()
        ],
    }

@router.get("/company/{company_id}")
async def company_details(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    company = (
        db.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if company is None:
        return {
            "error": "Company not found"
        }

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == current_user.id,
        )
        .order_by(
            AnalysisResult.created_at.desc()
        )
        .all()
    )

    response = []

    for analysis in analyses:

        response.append(
            {
                "analysis_id": analysis.id,
                "intent_score": analysis.intent.get(
                    "intent_score",
                    0,
                ),
                "priority": analysis.intent.get(
                    "priority",
                    "",
                ),
                "buying_stage": analysis.intent.get(
                    "buying_stage",
                    "",
                ),
                "decision_maker": analysis.persona.get(
                    "primary_decision_maker",
                    "",
                ),
                "created_at": analysis.created_at,
            }
        )

    return {
        "company": {
            "id": company.id,
            "name": company.name,
            "website": company.website,
            "industry": company.industry,
        },
        "analyses": response,
    }


@router.delete("/company/{company_id}")
async def delete_company_research(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes all of this user's research on a company: every analysis,
    every outreach draft tied to it, and the underlying knowledge
    extracted for those analyses. If no other user has research on the
    same Company row, the company record itself is removed too.
    """

    deleted = company_service.delete_research(
        db,
        current_user.id,
        company_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="No research found for this company",
        )

    return {
        "success": True,
        "message": "Company research deleted",
        "company_id": company_id,
    }


@router.get("/search")
async def search_workspace(
    q: str,
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

    q = q.lower()

    results = []

    for analysis in analyses:

        company = analysis.company

        searchable = [
            company.name if company else "",
            analysis.persona.get(
                "primary_decision_maker",
                "",
            ),
            str(
                analysis.strategy.get(
                    "account_summary",
                    "",
                )
            ),
            str(
                analysis.intent.get(
                    "reasoning",
                    "",
                )
            ),
        ]

        text = " ".join(searchable).lower()

        if q in text:

            results.append(
                {
                    "analysis_id": analysis.id,
                    "company": company.name if company else "",
                    "decision_maker": analysis.persona.get(
                        "primary_decision_maker",
                        "",
                    ),
                    "intent_score": analysis.intent.get(
                        "intent_score",
                        0,
                    ),
                    "priority": analysis.intent.get(
                        "priority",
                        "",
                    ),
                }
            )

    return results

@router.get("/filter")
async def filter_workspace(
    priority: str | None = None,
    stage: str | None = None,
    intent_min: int | None = None,
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

    response = []

    for analysis in analyses:

        if priority:

            if (
                analysis.intent.get(
                    "priority",
                    ""
                ).lower()
                != priority.lower()
            ):
                continue

        if stage:

            if (
                analysis.intent.get(
                    "buying_stage",
                    ""
                ).lower()
                != stage.lower()
            ):
                continue

        if intent_min:

            if (
                analysis.intent.get(
                    "intent_score",
                    0
                )
                < intent_min
            ):
                continue

        response.append(
            {
                "analysis_id": analysis.id,
                "company": analysis.company.name,
                "intent_score": analysis.intent.get(
                    "intent_score",
                    0,
                ),
                "priority": analysis.intent.get(
                    "priority",
                    "",
                ),
                "buying_stage": analysis.intent.get(
                    "buying_stage",
                    "",
                ),
            }
        )

    return response


@router.get("/company/{company_id}/dashboard")
async def company_dashboard(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    company = (
        db.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if company is None:
        return {
            "error": "Company not found"
        }

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == current_user.id,
        )
        .order_by(
            AnalysisResult.created_at.desc()
        )
        .all()
    )

    if not analyses:
        return {
            "error": "No analyses found"
        }

    latest = analyses[0]

    intent_scores = [
        a.intent.get("intent_score", 0)
        for a in analyses
    ]

    average_intent = round(
        mean(intent_scores),
        2,
    )

    latest_intent = latest.intent

    latest_persona = latest.persona

    latest_strategy = latest.strategy

    latest_guardrail = latest.guardrail

    dashboard = {

        "company": {

            "id": company.id,

            "name": company.name,

            "website": company.website,

            "industry": company.industry,
        },

        "summary": latest_strategy.get(
            "account_summary",
            "",
        ),

        "health_score": average_intent,

        "latest_intent_score": latest_intent.get(
            "intent_score",
            0,
        ),

        "priority": latest_intent.get(
            "priority",
            "",
        ),

        "buying_stage": latest_intent.get(
            "buying_stage",
            "",
        ),

        "risk_level": latest_guardrail.get(
            "risk_level",
            "",
        ),

        "decision_maker": latest_persona.get(
            "primary_decision_maker",
            "",
        ),

        "recommended_action": latest_strategy.get(
            "next_best_action",
            "",
        ),

        "communication_style": latest_persona.get(
            "communication_style",
            "",
        ),

        "confidence": latest_guardrail.get(
            "confidence",
            0,
        ),

        "analyses_count": len(
            analyses
        ),

        "latest_analysis": {

            "analysis_id": latest.id,

            "created_at": latest.created_at,
        }
    }

    return dashboard

@router.get("/recommendations")
async def recommendations(
    company_id: int | None = None,
    purpose: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    query = db.query(AnalysisResult).filter(
        AnalysisResult.user_id == current_user.id
    )

    if company_id is not None:
        query = query.filter(AnalysisResult.company_id == company_id)

    analyses = query.order_by(AnalysisResult.created_at.asc()).all()

    latest_by_company: dict[int, AnalysisResult] = {}
    for analysis in analyses:
        latest_by_company[analysis.company_id] = analysis

    needed_knowledge_ids = {a.knowledge_id for a in latest_by_company.values()}
    knowledge_by_id: dict[int, dict] = {}
    if needed_knowledge_ids:
        knowledge_sources = (
            db.query(KnowledgeSource)
            .filter(KnowledgeSource.id.in_(needed_knowledge_ids))
            .all()
        )
        knowledge_by_id = {
            ks.id: (ks.processed_data.get("knowledge", {}) or {}) for ks in knowledge_sources
        }

    recommendations = []

    for analysis in latest_by_company.values():

        company = analysis.company

        if company is None:
            continue

        knowledge = knowledge_by_id.get(analysis.knowledge_id, {}) or {}
        persona = analysis.persona or {}
        guardrail = analysis.guardrail or {}
        strategy = analysis.strategy or {}

        score = 0

        reasons = []

        intent_score = analysis.intent.get(
            "intent_score",
            0,
        )

        score += intent_score

        if analysis.intent.get("priority") == "High":
            score += 10
            reasons.append("High priority account")

        decision_maker = persona.get("primary_decision_maker", "")

        if decision_maker:
            score += 5
            reasons.append("Decision maker identified")

        if guardrail.get(
            "risk_level",
            ""
        ).lower() == "low":
            score += 5
            reasons.append("Low execution risk")

        if strategy.get(
            "next_best_action",
            ""
        ):
            score += 5
            reasons.append("Clear next action available")

        # =====================================================
        # Intent-driven outreach strategy
        #
        # The tier (HIGH/MEDIUM/LOW) and the recommended strategy
        # option come only from the EXISTING intent_score plus real,
        # already-extracted account fields — nothing new is scored or
        # invented here.
        # =====================================================
        level = _intent_level(intent_score)
        selected_key = _select_strategy_key(level, knowledge, persona)
        strategy_options = _strategy_options_for(level, selected_key)
        recommended_option = next(
            (opt for opt in strategy_options if opt["recommended"]),
            strategy_options[0] if strategy_options else None,
        )

        pain_points = knowledge.get("pain_points") or []
        buying_signals = knowledge.get("buying_signals") or []
        sources = knowledge.get("sources") or []
        knowledge_confidence = knowledge.get("confidence", 0) or 0

        # Evidence is "insufficient" when there's essentially nothing
        # grounding this account beyond the bare intent score — the UI
        # should say so plainly instead of implying a rich evidence base.
        evidence_sufficient = bool(sources or pain_points or buying_signals)

        applicable_purposes = _applicable_purposes(
            knowledge,
            persona,
            decision_maker,
            pain_points,
            buying_signals,
            sources,
        )

        purpose_strategy = None
        if purpose:
            purpose_strategy = _purpose_strategy(
                purpose,
                level,
                company.name,
                decision_maker,
                pain_points,
                buying_signals,
                applicable_purposes,
            )

        why_parts = [f"{company.name} scored {intent_score}/100 intent ({level})."]

        if decision_maker:
            why_parts.append(f"A named decision-maker ({decision_maker}) was identified.")
        if pain_points:
            why_parts.append(f"{len(pain_points)} pain point(s) were extracted from real evidence.")
        if buying_signals:
            why_parts.append(f"{len(buying_signals)} buying signal(s) were detected.")
        if sources:
            why_parts.append(f"Grounded in {len(sources)} real source(s) from research.")
        if not evidence_sufficient:
            why_parts.append(
                "Limited supporting evidence is available for this account — "
                "this recommendation reflects the intent score alone."
            )

        recommendations.append(
            {
                "analysis_id": analysis.id,
                "company_id": company.id,
                "company": company.name,
                "website": company.website,
                "industry": company.industry,
                "score": min(score, 100),
                "priority": analysis.intent.get(
                    "priority",
                    "",
                ),
                "intent": intent_score,
                "intent_score": intent_score,
                "intent_level": level,
                "buying_stage": analysis.intent.get(
                    "buying_stage",
                    "",
                ),
                "risk_level": guardrail.get(
                    "risk_level",
                    "",
                ),
                "decision_maker": decision_maker,
                "confidence": guardrail.get(
                    "confidence",
                    0,
                ),
                "knowledge_confidence": knowledge_confidence,
                "next_action": strategy.get(
                    "next_best_action",
                    "",
                ),
                "reason": reasons,
                "why_this_recommendation": " ".join(why_parts),
                "strategy_options": strategy_options,
                "recommended_strategy": recommended_option,
                "pain_points": pain_points,
                "buying_signals": buying_signals,
                "evidence": sources,
                "evidence_sufficient": evidence_sufficient,
                "available_purposes": [
                    {"key": key, "label": OUTREACH_PURPOSES[key]["label"]}
                    for key in applicable_purposes
                ],
                "purpose_strategy": purpose_strategy,
                "created_at": analysis.created_at,
            }
        )

    recommendations.sort(
        key=lambda x: x["score"],
        reverse=True,
    )

    return {
        "recommended_companies": recommendations
    }


@router.get("/company/{company_id}/trend")
async def company_trend(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == current_user.id,
        )
        .order_by(
            AnalysisResult.created_at.asc()
        )
        .all()
    )

    if not analyses:
        return {
            "error": "No analyses found"
        }

    history = []

    priorities = []

    stages = []

    for analysis in analyses:

        history.append(
            {
                "analysis_id": analysis.id,
                "date": analysis.created_at,
                "intent_score": analysis.intent.get(
                    "intent_score",
                    0,
                ),
            }
        )

        priorities.append(
            analysis.intent.get(
                "priority",
                "",
            )
        )

        stages.append(
            analysis.intent.get(
                "buying_stage",
                "",
            )
        )

    scores = [
        x["intent_score"]
        for x in history
    ]

    current = scores[-1]

    previous = scores[-2] if len(scores) > 1 else current

    change = current - previous

    if change > 5:
        trend = "Increasing"

    elif change < -5:
        trend = "Decreasing"

    else:
        trend = "Stable"

    if current >= 80:

        recommendation = "Contact immediately"

    elif current >= 60:

        recommendation = "Continue nurturing"

    else:

        recommendation = "Monitor account"

    return {

        "company_id": company_id,

        "trend": trend,

        "current_intent": current,

        "previous_intent": previous,

        "change": change,

        "recommendation": recommendation,

        "history": history,

        "priority_history": priorities,

        "buying_stage_history": stages,

    }

@router.get("/company/{company_id}/activity")
async def company_activity(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == current_user.id,
        )
        .order_by(
            AnalysisResult.created_at.asc()
        )
        .all()
    )

    if not analyses:
        return {
            "error": "No activity found"
        }

    timeline = []

    for analysis in analyses:

        created = analysis.created_at

        knowledge = (
            db.query(KnowledgeSource)
            .filter(
                KnowledgeSource.id == analysis.knowledge_id
            )
            .first()
        )

        if knowledge:

            company = knowledge.processed_data.get(
                "knowledge",
                {}
            ).get(
                "company",
                ""
            )

            timeline.append({
                "time": created,
                "type": "Knowledge",
                "icon": "📄",
                "title": "Knowledge Extracted",
                "description": f"Company identified as {company}"
            })

        decision = analysis.persona.get(
            "primary_decision_maker",
            ""
        )

        if decision:

            timeline.append({
                "time": created,
                "type": "Persona",
                "icon": "👤",
                "title": "Decision Maker Identified",
                "description": decision
            })

        timeline.append({
            "time": created,
            "type": "Intent",
            "icon": "📈",
            "title": "Buying Intent",
            "description": f'Intent Score: {analysis.intent.get("intent_score",0)}'
        })

        timeline.append({
            "time": created,
            "type": "Strategy",
            "icon": "🎯",
            "title": "Next Best Action",
            "description": analysis.strategy.get(
                "next_best_action",
                ""
            )
        })

        timeline.append({
            "time": created,
            "type": "Guardrail",
            "icon": "🛡️",
            "title": "Risk Assessment",
            "description": analysis.guardrail.get(
                "risk_level",
                ""
            )
        })

    timeline.sort(
        key=lambda x: x["time"]
    )

    return {
        "company_id": company_id,
        "company": analyses[0].company.name,
        "total_events": len(timeline),
        "timeline": timeline,
    }




def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "unknown"

def _source_labels(sources) -> list[str]:
   
    labels = []
    for s in sources or []:
        if isinstance(s, dict):
            title = s.get("title") or ""
            url = s.get("url") or ""
            if title and url:
                labels.append(f"{title} ({url})")
            else:
                labels.append(title or url)
        elif isinstance(s, str) and s:
            labels.append(s)
    return labels


def _to_text(value) -> str:
    """
    Coerce whatever the LLM/persona agent actually returned into a plain
    string. `primary_decision_maker` (and similar persona/knowledge
    fields) are documented as strings, but the underlying LLM
    occasionally returns a structured object instead (e.g.
    {"name": "Sarah Chen", "title": "CTO"}) — without this, calling
    .strip()/.lower() on that dict crashes the whole endpoint with a
    500. This normalizes any shape (dict, list, None, str) down to text
    instead of trusting the LLM's output format.
    """
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("name", "primary_decision_maker", "decision_maker", "title"):
            candidate = value.get(key)
            if isinstance(candidate, str) and candidate:
                return candidate
        return " ".join(str(v) for v in value.values() if isinstance(v, str)) or ""
    if isinstance(value, (list, tuple)):
        return ", ".join(_to_text(v) for v in value if v)
    return str(value)


def _latest_knowledge_for_company(
    db: Session,
    company_id: int,
    user_id: int,
):
    latest_analysis = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == user_id,
        )
        .order_by(AnalysisResult.created_at.desc())
        .first()
    )

    if latest_analysis is None:
        return None, None

    knowledge_source = (
        db.query(KnowledgeSource)
        .filter(KnowledgeSource.id == latest_analysis.knowledge_id)
        .first()
    )

    if knowledge_source is None:
        return latest_analysis, None

    return latest_analysis, knowledge_source.processed_data.get("knowledge", {})


def _infer_influence(name, role, primary_decision_maker) -> str:
    name = _to_text(name)
    role = _to_text(role)
    primary_decision_maker = _to_text(primary_decision_maker)

    role_lower = role.lower()

    if name and primary_decision_maker and name.strip().lower() == primary_decision_maker.strip().lower():
        return "Decision Maker"

    if any(k in role_lower for k in ["cfo", "finance", "budget", "procurement"]):
        return "Budget Holder"

    if any(k in role_lower for k in ["security", "compliance", "legal", "risk"]):
        return "Blocker"

    if any(k in role_lower for k in ["vp", "head", "director", "lead"]):
        return "Champion"

    return "Influencer"


@router.get("/company/{company_id}/stakeholders")
async def company_stakeholders(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis, knowledge = _latest_knowledge_for_company(db, company_id, current_user.id)

    if analysis is None:
        return []

    knowledge = knowledge or {}
    persona = analysis.persona or {}
    primary_decision_maker = _to_text(persona.get("primary_decision_maker", ""))

    contacts = knowledge.get("contacts", []) or []
    pain_points = knowledge.get("pain_points", []) or []
    buying_signals = knowledge.get("buying_signals", []) or []
    confidence = knowledge.get("confidence", 0) or 0

    if not contacts:
        contacts = [
            {"name": _to_text(name), "role": "", "email": "", "phone": ""}
            for name in (knowledge.get("decision_makers", []) or [])
        ]

    stakeholders = []

    for contact in contacts:
        name = _to_text(contact.get("name", "")) or "Unknown"
        role = _to_text(contact.get("role", ""))

        linkedin_url = contact.get("linkedin_url", "") or ""

        stakeholders.append(
            {
                "id": _slugify(f"{company_id}-{name}"),
                "name": name,
                "title": role or "Unknown role",
                "dept": role.split(" ")[0] if role else "General",
                "influence": _infer_influence(name, role, primary_decision_maker),
                "score": confidence,
                "linkedin": bool(linkedin_url),
                "linkedinUrl": linkedin_url,
                "email": contact.get("email", "") or "",
                "companyId": str(company_id),
                "evidence": _source_labels(knowledge.get("sources", [])),
                "painPoints": pain_points,
                "buyingSignals": buying_signals,
            }
        )

    return stakeholders


@router.get("/company/{company_id}/pain-points")
async def company_pain_points(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis, knowledge = _latest_knowledge_for_company(db, company_id, current_user.id)

    if analysis is None:
        return []

    knowledge = knowledge or {}
    points = knowledge.get("pain_points", []) or []
    confidence = knowledge.get("confidence", 0) or 0
    source_count = max(len(knowledge.get("sources", []) or []), 1)

    result = []

    for i, point in enumerate(points):
        severity = "critical" if i == 0 else "high" if i == 1 else "medium"

        result.append(
            {
                "id": _slugify(f"{company_id}-pain-{i}-{point}"),
                "title": point if len(point) <= 80 else point[:77] + "...",
                "severity": severity,
                "confidence": confidence,
                "sources": source_count,
                "excerpt": point,
                "companyId": str(company_id),
            }
        )

    return result


@router.get("/company/{company_id}/buying-signals")
async def company_buying_signals(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis, knowledge = _latest_knowledge_for_company(db, company_id, current_user.id)

    if analysis is None:
        return []

    knowledge = knowledge or {}
    signals = knowledge.get("buying_signals", []) or []

    result = []

    for i, signal in enumerate(signals):
        result.append(
            {
                "id": _slugify(f"{company_id}-signal-{i}-{signal}"),
                "title": signal,
                "strength": "strong" if i == 0 else "moderate",
                "detectedAt": analysis.created_at.date().isoformat(),
                "source": "Extracted from ingested notes",
            }
        )

    return result


@router.get("/company/{company_id}/graph")
async def company_graph(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis, knowledge = _latest_knowledge_for_company(db, company_id, current_user.id)

    if analysis is None:
        return {"nodes": [], "edges": []}

    knowledge = knowledge or {}
    persona = analysis.persona or {}
    primary_decision_maker = _to_text(persona.get("primary_decision_maker", ""))

    contacts = knowledge.get("contacts", []) or []
    if not contacts:
        contacts = [
            {"name": _to_text(name), "role": "Decision Maker"}
            for name in (knowledge.get("decision_makers", []) or [])
        ]

    # Fallback if still no contacts: derive from persona or analysis company
    if not contacts:
        company_name = analysis.company.name if analysis and analysis.company else "Target Account"
        if primary_decision_maker:
            contacts.append({
                "name": primary_decision_maker,
                "role": _to_text(persona.get("target_role", "Executive Decision Maker")),
            })
        else:
            contacts.append({
                "name": f"{company_name} Executive Team",
                "role": "Key Stakeholder",
            })

    pain_points = knowledge.get("pain_points", []) or []
    buying_signals = knowledge.get("buying_signals", []) or []
    confidence = knowledge.get("confidence", 85) or 85

    nodes = []
    decision_maker_id = None

    for contact in contacts:
        name = _to_text(contact.get("name", "")) or "Unknown"
        role = _to_text(contact.get("role", ""))
        node_id = _slugify(f"{company_id}-{name}")
        influence = _infer_influence(name, role, primary_decision_maker)

        if influence == "Decision Maker":
            decision_maker_id = node_id

        nodes.append(
            {
                "id": node_id,
                "name": name,
                "title": role or "Unknown role",
                "influence": influence,
                "confidence": confidence,
                "evidence": _source_labels(knowledge.get("sources", [])),
                "painPoints": pain_points,
                "buyingSignals": buying_signals,
            }
        )

    edges = []

    if decision_maker_id:
        for node in nodes:
            if node["id"] != decision_maker_id:
                edges.append(
                    {
                        "id": f"{node['id']}-{decision_maker_id}",
                        "source": node["id"],
                        "target": decision_maker_id,
                        "label": "reports to",
                    }
                )

    return {"nodes": nodes, "edges": edges}