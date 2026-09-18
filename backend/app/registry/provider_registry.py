from app.llm.base import BaseLLMProvider


class ProviderRegistry:
    """
    Registry for all LLM providers.
    """

    def __init__(self):
        self._providers: dict[str, BaseLLMProvider] = {}

    def register(self, name: str, provider: BaseLLMProvider):
        self._providers[name] = provider

    def get(self, name: str) -> BaseLLMProvider:
        if name not in self._providers:
            raise ValueError(f"Provider '{name}' is not registered.")

        return self._providers[name]

    def list_providers(self) -> list[str]:
        return list(self._providers.keys())