from app.llm.base import BaseLLMProvider
from app.llm.schemas import LLMResponse


class OllamaProvider(BaseLLMProvider):

    async def generate(self, prompt: str) -> LLMResponse:

        return LLMResponse(
            content=f"Ollama received: {prompt}",
            provider="ollama",
            model="placeholder",
        )