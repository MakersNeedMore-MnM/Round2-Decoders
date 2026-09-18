import time

from groq import AsyncGroq

from app.core.config import settings
from app.llm.base import BaseLLMProvider
from app.llm.schemas import LLMResponse


class GroqProvider(BaseLLMProvider):
    """
    Groq LLM Provider.
    """

    def __init__(self):
        self.client = AsyncGroq(
            api_key=settings.GROQ_API_KEY
        )

        self.model = "llama-3.3-70b-versatile"

    async def generate(self, prompt: str) -> LLMResponse:

        start = time.perf_counter()

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.7,
        )

        latency = time.perf_counter() - start

        return LLMResponse(
            content=response.choices[0].message.content,
            provider="groq",
            model=self.model,
            tokens=response.usage.total_tokens if response.usage else None,
            latency=round(latency, 3),
        )