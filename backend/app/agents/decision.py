import json
import re


class DecisionEngine:
    """
    Decides which tool(s) should be used for a task.

    Returns a research plan instead of only a tool name.
    """

    def __init__(self, llm):
        self.llm = llm

    async def choose_tool(self, task: str):

        prompt = f"""
You are ProspectIQ's Research Planner.

Available tools

1. calculator
2. weather
3. search
4. news

Rules:

- If the user asks about a company, create MULTIPLE search queries.
- Never perform only one search for company research.
- Return ONLY valid JSON.

Example:

{{
    "tool":"search",
    "queries":[
        "Microsoft company overview",
        "Microsoft leadership",
        "Microsoft products",
        "Microsoft AI initiatives",
        "Microsoft recent news",
        "Microsoft hiring",
        "Microsoft competitors",
        "Microsoft financials"
    ]
}}

Calculator:

{{"tool":"calculator"}}

Weather:

{{"tool":"weather"}}

No tool:

{{"tool":"none"}}

User Request:

{task}
"""

        response = await self.llm.generate(prompt)

        content = (
            response.content
            if hasattr(response, "content")
            else str(response)
        ).strip()

        if content.startswith("```"):
            content = (
                content.replace("```json", "")
                .replace("```", "")
                .strip()
            )

        try:

            data = json.loads(content)

            if data.get("tool") == "none":
                return None

            # Ensure queries always exist for search
            if data.get("tool") == "search":

                if not data.get("queries"):

                    data["queries"] = [task]

            return data

        except Exception:

            task_lower = task.lower()

            # Calculator

            if any(op in task for op in ["+", "-", "*", "/", "%"]):

                return {
                    "tool": "calculator",
                }

            # Weather

            if any(word in task_lower for word in [
                "weather",
                "forecast",
                "temperature",
                "climate",
            ]):

                return {
                    "tool": "weather",
                }

            # Default

            return {
                "tool": "search",
                "queries": [
                    task,
                ],
            }

    async def extract_arguments(
        self,
        tool: str,
        task: str,
        query: str | None = None,
    ):

        # -----------------------
        # Calculator
        # -----------------------

        if tool == "calculator":

            match = re.search(
                r"[0-9+\-*/().% ]+",
                task,
            )

            expression = (
                match.group().strip()
                if match
                else task
            )

            return {
                "expression": expression,
            }

        # -----------------------
        # Weather
        # -----------------------

        if tool == "weather":

            city = (
                task.lower()
                .replace("weather", "")
                .replace("forecast", "")
                .replace("temperature", "")
                .replace("in", "")
                .strip()
            )

            if not city:
                city = "Mumbai"

            return {
                "city": city.title(),
            }

        # -----------------------
        # Search
        # -----------------------

        if tool == "search":

            return {
                "query": query if query else task,
            }

        # -----------------------
        # News
        # -----------------------

        if tool == "news":

            company = (
                task.lower()
                .replace("give me report on", "")
                .replace("report on", "")
                .replace("tell me about", "")
                .replace("company", "")
                .strip()
            )

            return {
                "company": company.title(),
            }

        return {}