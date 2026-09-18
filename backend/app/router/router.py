from app.core.context import context


class Router:
    """
    Routes a task to the correct agent.
    """

    # Short factual/general questions go to the research agent
    # (calculator / web search / weather tools). Everything else is
    # assumed to be prospect research - a company brief, notes, or
    # website summary - and goes to the sales-analysis pipeline, since
    # that's the primary purpose of this app.
    RESEARCH_SIGNALS = [
        "what is",
        "who is",
        "why",
        "how does",
        "how do",
        "explain",
        "calculate",
        "weather",
        "forecast",
        "latest news",
    ]

    async def route(self, task: str):
        """
        Decide which agent should execute the task.

        This is a heuristic placeholder — swap it for an LLM-based
        classifier later without changing the Supervisor or agents.
        """

        normalized = task.lower().strip()

        looks_like_question = normalized.endswith("?") or any(
            normalized.startswith(signal) for signal in self.RESEARCH_SIGNALS
        )

        is_short = len(normalized.split()) <= 12

        if looks_like_question and is_short:
            return context.agent_registry.get("research")

        return context.agent_registry.get("sales_analysis")