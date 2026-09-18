import json

from app.agents.strategy.prompt import STRATEGY_PROMPT
from app.core.context import context
from app.utils.llm_json import LLMJsonParser


class StrategyAgent:

    async def generate(
        self,
        knowledge: dict,
        persona: dict,
        intent: dict,
    ):

        prompt = f"""
{STRATEGY_PROMPT}

Knowledge:

{json.dumps(knowledge, indent=2)}

Persona:

{json.dumps(persona, indent=2)}

Intent:

{json.dumps(intent, indent=2)}
"""

        response = await context.llm.generate(prompt)

        try:
            return LLMJsonParser.parse(response)

        except Exception as e:

            print("Strategy Agent Error:", e)

            return {
                "account_summary": "",
                "next_best_action": "",
                "email_subject": "",
                "email_body": "",
                "linkedin_message": "",
                "call_talking_points": [],
                "meeting_agenda": [],
                "confidence": 0,
            }