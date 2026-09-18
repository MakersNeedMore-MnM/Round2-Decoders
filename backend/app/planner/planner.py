import json

from app.core.context import context


class Planner:
    """
    Uses the LLM to generate an execution plan.
    """

    async def create_plan(
        self,
        task: str,
    ):

        prompt = f"""
You are the Planner for ProspectIQ.

Your job is to break the user's request into execution steps.

Return ONLY valid JSON.

Format:

[
  {{
    "step": 1,
    "action": "..."
  }}
]

User Request:

{task}
"""

        response = await context.llm.generate(
            prompt=prompt
        )

        try:
            return json.loads(response.content)

        except Exception:

            return [
                {
                    "step": 1,
                    "action": "Execute task"
                }
            ]