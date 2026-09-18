from app.agents.base import BaseAgent


class SalesAnalysisAgent(BaseAgent):
    """
    Wraps the full sales-intelligence pipeline (knowledge ingestion ->
    persona -> intent -> strategy -> guardrail) so the Supervisor/Router
    can treat it as just another agent instead of the frontend calling
    AssistantService directly.

    NOTE: AssistantService is imported lazily inside run(), not at module
    load time. AssistantService pulls in the persona/intent/strategy/
    guardrail agents, which each do `from app.core.context import
    context`. Since this agent is registered from inside
    app.core.context's own AppContext.__init__, importing
    AssistantService eagerly here would re-enter app.core.context while
    it's still mid-initialization (before the module-level `context`
    name exists) and raise a circular-import error. Deferring the import
    to run() means it only happens after the app has fully started.
    """

    name = "sales_analysis"
    description = (
        "Runs a company brief, notes, or website summary through the full "
        "sales-intelligence pipeline: persona, intent, strategy, and "
        "guardrail analysis. Use for anything that looks like research on "
        "a prospect/company rather than a general knowledge question."
    )

    def __init__(self, llm, tools):
        super().__init__(llm, tools)
        self._assistant_service = None

    async def run(self, task: str, **kwargs):
        current_user = kwargs.get("current_user")
        db = kwargs.get("db")

        if current_user is None or db is None:
            raise ValueError(
                "SalesAnalysisAgent requires 'current_user' and 'db' to be "
                "passed through from the Supervisor."
            )

        if self._assistant_service is None:
            from app.services.assistant_service import AssistantService

            self._assistant_service = AssistantService()

        result = await self._assistant_service.analyze(
            text=task,
            current_user=current_user,
            db=db,
            emit=kwargs.get("emit"),
        )

        return {
            "agent": self.name,
            "response": result,
        }