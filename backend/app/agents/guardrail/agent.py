import json

from app.agents.guardrail.prompt import GUARDRAIL_PROMPT
from app.core.context import context
from app.utils.llm_json import LLMJsonParser


class GuardrailAgent:

    async def verify(
        self,
        knowledge: dict,
        persona: dict,
        intent: dict,
        strategy: dict,
    ):

        prompt = f"""
{GUARDRAIL_PROMPT}

Knowledge:

{json.dumps(knowledge, indent=2)}

Persona:

{json.dumps(persona, indent=2)}

Intent:

{json.dumps(intent, indent=2)}

Strategy:

{json.dumps(strategy, indent=2)}
"""

        response = await context.llm.generate(prompt)

        try:
            return LLMJsonParser.parse(response)

        except Exception as e:

            print("Guardrail Agent Error:", e)

            return {
                "approved": False,
                "confidence": 0,
                "supported_claims": [],
                "unsupported_claims": [],
                "risk_level": "High",
                "recommendation": "",
                "reasoning": "",
            }