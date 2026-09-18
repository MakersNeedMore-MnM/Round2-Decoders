from app.agents.base import BaseAgent
from app.agents.decision import DecisionEngine
from app.core.events import emit_step
from app.utils.company_website import find_official_website


class ResearchAgentV2(BaseAgent):
    """
    Research Agent V2

    Stage 1:
    - Decide research plan
    - Execute multiple searches
    - Fetch official website and latest news
    - Combine into a single evidence text via LLM (token-optimized)
    """

    name = "research"
    description = "Multi-source Research Agent"

    def __init__(self, llm, tools):
        super().__init__(llm, tools)
        self.decision = DecisionEngine(self.llm)

    async def run(
        self,
        task: str,
        **kwargs,
    ):
        emit = kwargs.get("emit")

        # -----------------------------
        # Build research plan
        # -----------------------------
        await emit_step(
            emit,
            id="research_plan",
            label="Deciding which tools this task needs...",
            status="active",
            agent="ResearchAgentV2",
        )

        decision = await self.decision.choose_tool(task)

        if decision is None:
            await emit_step(
                emit,
                id="research_plan",
                label="No external lookup needed — using the task text directly.",
                status="done",
                agent="ResearchAgentV2",
            )
            return {
                "agent": self.name,
                "tool_used": None,
                "evidence": task,
                "sources": [],
            }

        tool = decision.get("tool")

        await emit_step(
            emit,
            id="research_plan",
            label=f"Research plan ready — using the {tool} tool.",
            status="done",
            agent="ResearchAgentV2",
        )

        # -----------------------------------
        # Search Pipeline
        # -----------------------------------
        if tool == "search":
            queries = decision.get("queries", [task])
            results = []

            await emit_step(
                emit,
                id="research_search",
                label=f"Searching the web ({len(queries)} quer{'y' if len(queries) == 1 else 'ies'})...",
                status="active",
                agent="ResearchAgentV2",
            )

            for query in queries:
                args = await self.decision.extract_arguments(
                    tool="search",
                    task=task,
                    query=query,
                )

                search_result = await self.tools.execute(
                    "search",
                    **args,
                )

                if search_result.get("success"):
                    results.extend(search_result["results"])

            # Remove duplicate URLs
            unique = {}
            for item in results:
                url = item.get("url")
                if url:
                    unique[url] = item

            merged = list(unique.values())

            # Token Optimization: Limit top search results to 5
            top_sources = merged[:5]

            await emit_step(
                emit,
                id="research_search",
                label=f"Found {len(top_sources)} relevant source(s).",
                status="done",
                agent="ResearchAgentV2",
            )

            # -----------------------------------
            # Step 2: Official Website
            # -----------------------------------
            website = None
            official_url = find_official_website(top_sources)

            if official_url:
                await emit_step(
                    emit,
                    id="research_website",
                    label=f"Reading the company website ({official_url})...",
                    status="active",
                    agent="ResearchAgentV2",
                )

                website = await self.tools.execute(
                    "website",
                    url=official_url,
                )

                await emit_step(
                    emit,
                    id="research_website",
                    label="Website content captured.",
                    status="done",
                    agent="ResearchAgentV2",
                )

            # -----------------------------------
            # Step 3: News Pipeline
            # -----------------------------------
            await emit_step(
                emit,
                id="research_news",
                label="Checking for recent news...",
                status="active",
                agent="ResearchAgentV2",
            )

            news_args = await self.decision.extract_arguments(
                tool="news",
                task=task,
            )

            news = await self.tools.execute(
                "news",
                **news_args,
            )

            await emit_step(
                emit,
                id="research_news",
                label=f"News check complete ({len(news.get('results', []) or []) if news else 0} article(s)).",
                status="done",
                agent="ResearchAgentV2",
            )

            # -----------------------------------
            # Step 4: Build Token-Optimized Search Text
            # -----------------------------------
            search_text = ""

            # Top 5 search results only
            for item in top_sources:
                search_text += f"""
Title:{item.get("title", "")}
Content:{item.get("content", "")}
"""

            if website and website.get("content"):
                search_text += f"""
Website:{website.get("content", "")}
"""

            # Top 5 news articles only
            if news and news.get("success") and news.get("results"):
                search_text += "\nLatest News:\n"
                for article in news["results"][:5]:
                    search_text += f"""
Title:{article.get("title", "")}
Content:{article.get("content", "")}
"""

            # -----------------------------------
            # Step 5: LLM Call for Evidence Synthesis
            # -----------------------------------
            prompt = f"""
User Request: {task}

Collected Information:
{search_text}

Return factual evidence only.
Do NOT answer the user.

Keep:
Company
Website
Industry
Products
CEO
Decision Makers
AI
Recent News
Hiring
Competitors
Business Goals
"""

            await emit_step(
                emit,
                id="research_synthesis",
                label="Synthesizing everything into a single evidence brief...",
                status="active",
                agent="ResearchAgentV2",
            )

            response = await self.llm.generate(prompt)
            evidence = response.content

            await emit_step(
                emit,
                id="research_synthesis",
                label="Evidence brief ready.",
                status="done",
                agent="ResearchAgentV2",
            )

            # -----------------------------------
            # Step 6: Final Return
            # -----------------------------------
            return {
                "agent": self.name,
                "tool_used": [
                    "search",
                    "website",
                    "news",
                ],
                "queries": queries,
                "sources": top_sources,
                "website": website,
                "news": news,
                "evidence": evidence,
            }

        # -----------------------------------
        # Calculator
        # -----------------------------------
        if tool == "calculator":
            await emit_step(
                emit,
                id="research_tool",
                label="Running the calculator...",
                status="active",
                agent="ResearchAgentV2",
            )

            args = await self.decision.extract_arguments(
                tool,
                task,
            )

            result = await self.tools.execute(
                tool,
                **args,
            )

            await emit_step(
                emit,
                id="research_tool",
                label="Calculation complete.",
                status="done",
                agent="ResearchAgentV2",
            )

            return {
                "agent": self.name,
                "tool_used": [
                    "calculator",
                ],
                "response": result,
                "evidence": str(result),
            }

        # -----------------------------------
        # Weather
        # -----------------------------------
        if tool == "weather":
            await emit_step(
                emit,
                id="research_tool",
                label="Checking the weather...",
                status="active",
                agent="ResearchAgentV2",
            )

            args = await self.decision.extract_arguments(
                tool,
                task,
            )

            result = await self.tools.execute(
                tool,
                **args,
            )

            await emit_step(
                emit,
                id="research_tool",
                label="Weather lookup complete.",
                status="done",
                agent="ResearchAgentV2",
            )

            return {
                "agent": self.name,
                "tool_used": [
                    "weather",
                ],
                "response": result,
                "evidence": str(result),
            }

        return {
            "agent": self.name,
            "tool_used": None,
            "response": task,
            "evidence": task,
        }