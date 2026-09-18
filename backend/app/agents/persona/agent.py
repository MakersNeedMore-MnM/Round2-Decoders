from app.agents.persona.prompt import PERSONA_PROMPT
from app.core.context import context
from app.utils.llm_json import LLMJsonParser

import json


class PersonaAgent:

    async def analyze(
        self,
        knowledge: dict,
    ):

        prompt = f"""
{PERSONA_PROMPT}

Knowledge:

{json.dumps(knowledge, indent=2)}
"""

        response = await context.llm.generate(prompt)

        try:

            return LLMJsonParser.parse(response)

        except Exception as e:

            print("Persona Agent Error:", e)

            return {
                "primary_decision_maker": "",
                "buyer_persona": "",
                "decision_level": "",
                "communication_style": "",
                "key_interests": [],
                "recommended_approach": "",
            }