import time
from sqlalchemy.orm import Session

from app.agents.guardrail.agent import GuardrailAgent
from app.agents.intent.agent import IntentAgent
from app.agents.knowledge_ingestion.agent import KnowledgeIngestionAgent
from app.agents.persona.agent import PersonaAgent
from app.agents.strategy.agent import StrategyAgent

from app.models.user import User

from app.services.analysis_service import AnalysisService
from app.services.knowledge_service import KnowledgeService
from app.services.company_service import CompanyService
from app.core.context import context
from app.core.events import emit_step
from app.utils.evidence import merge_research_sources


class AssistantService:

    def __init__(self):
        self.ingestion = KnowledgeIngestionAgent()
        self.knowledge_service = KnowledgeService()
        self.analysis_service = AnalysisService()
        self.persona = PersonaAgent()
        self.intent = IntentAgent()
        self.strategy = StrategyAgent()
        self.guardrail = GuardrailAgent()
        self.company_service = CompanyService()

    async def analyze(
        self,
        text: str,
        current_user: User,
        db: Session,
        emit=None,
    ):
        start_time = time.perf_counter()
        timeline = []

        # =====================================================
        # Step 0 : Research Agent
        # =====================================================
        step_start = time.perf_counter()

        await emit_step(
            emit,
            id="research",
            label="Researching the company (web, website, news)...",
            status="active",
            agent="Research Agent",
        )

        research_agent = context.agent_registry.get("research")

        # Safety Check: Guard against missing agent or infinite recursion loops
        if not research_agent or research_agent.__class__.__name__ == "SalesAnalysisAgent":
            raise ValueError("Registry Error: 'research' agent returned an invalid or cyclic instance.")

        # Future-proof method call passing user and DB session context
        research = await research_agent.run(
            task=text,
            current_user=current_user,
            db=db,
            emit=emit,
        )

        # Send research evidence into downstream knowledge pipeline
        if research and isinstance(research, dict) and research.get("evidence"):
            text = research["evidence"]

        await emit_step(
            emit,
            id="research",
            label="Research complete.",
            status="done",
            agent="Research Agent",
        )

        timeline.append(
            {
                "step": 0,
                "agent": "Research Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 1 : Knowledge Ingestion
        # =====================================================
        step_start = time.perf_counter()

        await emit_step(
            emit,
            id="ingestion",
            label="Extracting structured company knowledge...",
            status="active",
            agent="Knowledge Ingestion",
        )

        normalized = await self.ingestion.ingest(text=text)

        await emit_step(
            emit,
            id="ingestion",
            label="Company knowledge extracted.",
            status="done",
            agent="Knowledge Ingestion",
        )

        timeline.append(
            {
                "step": 1,
                "agent": "Knowledge Ingestion",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 2 : Save Knowledge
        # =====================================================
        step_start = time.perf_counter()

        await emit_step(
            emit,
            id="knowledge_save",
            label="Saving knowledge to the repository...",
            status="active",
            agent="Knowledge Repository",
        )

        # Re-attach ResearchAgentV2's real sources (search results,
        # official website, news) to the structured knowledge object.
        # KnowledgeExtractionAgent only ever sees the evidence *text*
        # (titles/content, no URLs — see research_v2.py), so without
        # this, `knowledge["sources"]" would end up empty even when
        # research genuinely found real, citable sources. Nothing is
        # fabricated here: only URLs ResearchAgentV2 actually retrieved
        # are attached.
        normalized["knowledge"] = merge_research_sources(
            research,
            normalized["knowledge"],
        )

        record = self.knowledge_service.save(
            db=db,
            user_id=current_user.id,
            normalized_data=normalized,
        )

        knowledge = record.processed_data["knowledge"]

        company = self.company_service.get_or_create(
            db=db,
            name=knowledge.get("company", ""),
            website=knowledge.get("website", ""),
            industry=knowledge.get("industry", ""),
        )

        await emit_step(
            emit,
            id="knowledge_save",
            label=f"Knowledge saved for {knowledge.get('company', 'this account')}.",
            status="done",
            agent="Knowledge Repository",
        )

        timeline.append(
            {
                "step": 2,
                "agent": "Knowledge Repository",
                "status": "saved",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 3 : Persona Agent
        # =====================================================
        step_start = time.perf_counter()

        await emit_step(
            emit,
            id="persona",
            label="Identifying stakeholders and decision makers...",
            status="active",
            agent="Persona Agent",
        )

        persona = await self.persona.analyze(knowledge)

        await emit_step(
            emit,
            id="persona",
            label="Stakeholder persona built.",
            status="done",
            agent="Persona Agent",
        )

        timeline.append(
            {
                "step": 3,
                "agent": "Persona Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 4 : Intent Agent
        # =====================================================
        step_start = time.perf_counter()

        await emit_step(
            emit,
            id="intent",
            label="Scoring buying intent and priority...",
            status="active",
            agent="Intent Agent",
        )

        intent = await self.intent.analyze(knowledge)

        await emit_step(
            emit,
            id="intent",
            label=f"Intent scored ({intent.get('intent_score', 0)}/100).",
            status="done",
            agent="Intent Agent",
        )

        timeline.append(
            {
                "step": 4,
                "agent": "Intent Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 5 : Strategy Agent
        # =====================================================
        step_start = time.perf_counter()

        await emit_step(
            emit,
            id="strategy",
            label="Drafting outreach strategy and next best action...",
            status="active",
            agent="Strategy Agent",
        )

        strategy = await self.strategy.generate(knowledge, persona, intent)

        await emit_step(
            emit,
            id="strategy",
            label="Strategy ready.",
            status="done",
            agent="Strategy Agent",
        )

        timeline.append(
            {
                "step": 5,
                "agent": "Strategy Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 6 : Guardrail Agent
        # =====================================================
        step_start = time.perf_counter()

        await emit_step(
            emit,
            id="guardrail",
            label="Running guardrail / risk check...",
            status="active",
            agent="Guardrail Agent",
        )

        guardrail = await self.guardrail.verify(knowledge, persona, intent, strategy)

        await emit_step(
            emit,
            id="guardrail",
            label="Guardrail check complete — report approved."
            if guardrail.get("approved")
            else "Guardrail check complete — flagged for review.",
            status="done",
            agent="Guardrail Agent",
        )

        timeline.append(
            {
                "step": 6,
                "agent": "Guardrail Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Execution Metrics
        # =====================================================
        total_time = round(
            (time.perf_counter() - start_time) * 1000,
            2,
        )

        execution = {
            "total_time_ms": total_time,
            "agents_executed": 6,
            "knowledge_saved": True,
        }

        # =====================================================
        # Executive Summary
        # =====================================================
        overall_assessment = {
            "company": knowledge.get("company", ""),
            "decision_maker": (
                persona.get("primary_decision_maker")
                or (
                    knowledge.get("decision_makers", [""])[0]
                    if knowledge.get("decision_makers")
                    else ""
                )
            ),
            "intent_score": intent.get("intent_score", 0),
            "buying_stage": intent.get("buying_stage", ""),
            "priority": intent.get("priority", ""),
            "risk_level": guardrail.get("risk_level", ""),
            "approved": guardrail.get("approved", False),
            "next_action": strategy.get(
                "next_best_action",
                "",
            ),
            "overall_recommendation": guardrail.get(
                "recommendation",
                "",
            ),
        }

        # =====================================================
        # Save Analysis
        # =====================================================
        analysis = self.analysis_service.save(
            db=db,
            user_id=current_user.id,
            company_id=company.id,
            knowledge_id=record.id,
            persona=persona,
            intent=intent,
            strategy=strategy,
            guardrail=guardrail,
            overall_assessment=overall_assessment,
            timeline=timeline,
            execution=execution,
        )

        # =====================================================
        # Final Response
        # =====================================================
        await emit_step(
            emit,
            id="report",
            label="Executive report ready.",
            status="done",
            agent="Sales Analysis Pipeline",
        )

        return {
            "analysis_id": analysis.id,
            "company_id": company.id, 
            "research": research,
            "overall_assessment": overall_assessment,
            "knowledge_id": record.id,
            "knowledge": knowledge,
            "persona": persona,
            "intent": intent,
            "strategy": strategy,
            "guardrail": guardrail,
            "timeline": timeline,
            "execution": execution,
        }