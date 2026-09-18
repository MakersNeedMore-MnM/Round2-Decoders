from app.core.config import settings
from app.llm.schemas import LLMResponse
from app.registry.provider_registry import ProviderRegistry


class LLMManager:

    def __init__(self, registry: ProviderRegistry):
        self.registry = registry

    async def generate(
        self,
        prompt: str,
        provider: str | None = None,
    ) -> LLMResponse:

        provider_name = provider or settings.DEFAULT_PROVIDER

        llm = self.registry.get(provider_name)

        return await llm.generate(prompt)