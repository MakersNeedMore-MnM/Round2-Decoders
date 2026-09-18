from google import genai

from app.core.config import settings
from app.llm.base import BaseLLMProvider
from app.llm.schemas import LLMResponse


class GeminiProvider(BaseLLMProvider):
    """
    Gemini LLM Provider
    """

    def __init__(self):

        if not settings.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is missing in your .env file."
            )

        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        self.model = "gemini-2.5-pro"

    async def generate(
        self,
        prompt: str,
    ) -> LLMResponse:

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        text = response.text if response.text else ""

        return LLMResponse(
            content=text,
            provider="gemini",
            model=self.model,
        )