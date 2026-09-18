from app.agents.guardrail.agent import GuardrailAgent
from app.agents.intent.agent import IntentAgent
from app.agents.knowledge_ingestion.agent import KnowledgeIngestionAgent
from app.agents.persona.agent import PersonaAgent
from app.agents.strategy.agent import StrategyAgent
from app.core.context import context
from app.utils.evidence import merge_research_sources


class ProspectPipeline:
    """
    Central orchestration pipeline.

    Current flow:

    ResearchAgentV2
        ↓
    Knowledge Ingestion
        ↓
    Persona
        ↓
    Intent
        ↓
    Strategy
        ↓
    Guardrail

    NOTE: This class is not currently wired to any API route — the live
    production flow (Workspace chat -> /executor/stream -> Supervisor ->
    SalesAnalysisAgent) runs the equivalent orchestration through
    AssistantService.analyze() instead, since that's the version that
    already existed and was call-connected end to end. This class is
    kept in sync with that same flow (via app.core.context's shared
    agent_registry) rather than duplicating a second, divergent
    implementation of ResearchAgentV2 wiring.
    """

    def __init__(self):
        self.ingestion = KnowledgeIngestionAgent()
        self.persona = PersonaAgent()
        self.intent = IntentAgent()
        self.strategy = StrategyAgent()
        self.guardrail = GuardrailAgent()

    async def run(self, text: str):

        research_agent = context.agent_registry.get("research")

        research = None

        if research_agent is not None:
            research = await research_agent.run(task=text)

            if research and isinstance(research, dict) and research.get("evidence"):
                text = research["evidence"]

        normalized = await self.ingestion.ingest(
            text=text,
        )

        # Preserve ResearchAgentV2's real sources on the structured
        # knowledge object — see app/utils/evidence.py for why this is
        # needed (the evidence text alone doesn't carry URLs).
        normalized["knowledge"] = merge_research_sources(
            research,
            normalized["knowledge"],
        )

        knowledge = normalized["knowledge"]

        persona = await self.persona.analyze(
            knowledge,
        )

        intent = await self.intent.analyze(
            knowledge,
        )

        strategy = await self.strategy.generate(
            knowledge,
            persona,
            intent,
        )

        guardrail = await self.guardrail.verify(
            knowledge,
            persona,
            intent,
            strategy,
        )

        return {
            "research": research,
            "knowledge": knowledge,
            "persona": persona,
            "intent": intent,
            "strategy": strategy,
            "guardrail": guardrail,
        }