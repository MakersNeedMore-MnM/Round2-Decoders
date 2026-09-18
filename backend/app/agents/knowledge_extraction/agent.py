from app.agents.knowledge_extraction.prompt import EXTRACTION_PROMPT
from app.core.context import context
from app.utils.llm_json import LLMJsonParser


class KnowledgeExtractionAgent:
    """
    Extracts structured business knowledge
    from raw business text.
    """

    async def extract(
        self,
        text: str,
    ):

        prompt = f"""
{EXTRACTION_PROMPT}

Business Data:

{text}
"""

        response = await context.llm.generate(prompt)

        try:

            return LLMJsonParser.parse(response)

        except Exception as e:

            print("Knowledge Extraction Error:", e)

            return {
                "company": "",
                "industry": "",
                "website": "",
                "summary": "",
                "contacts": [],
                "decision_makers": [],
                "products": [],
                "services": [],
                "technologies": [],
                "pain_points": [],
                "business_goals": [],
                "buying_signals": [],
                "competitors": [],
                "opportunities": [],
                "risks": [],
                "recent_events": [],
                "sentiment": "",
                "confidence": 0,
                "sources": [],
            }