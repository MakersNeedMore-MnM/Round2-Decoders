import json

from app.agents.intent.prompt import INTENT_PROMPT
from app.core.context import context
from app.utils.llm_json import LLMJsonParser


class IntentAgent:

    async def analyze(
        self,
        knowledge: dict,
    ):

        prompt = f"""
{INTENT_PROMPT}

Knowledge:

{json.dumps(knowledge, indent=2)}
"""

        response = await context.llm.generate(prompt)

        try:

            return LLMJsonParser.parse(response)

        except Exception as e:

            print("Intent Agent Error:", e)

            return {
                "intent_score": 0,
                "buying_stage": "",
                "priority": "",
                "confidence": 0,
                "positive_signals": [],
                "negative_signals": [],
                "recommended_next_action": "",
                "reasoning": "",
            }