from abc import ABC, abstractmethod

from app.llm.schemas import LLMResponse


class BaseLLMProvider(ABC):

    @abstractmethod
    async def generate(self, prompt: str) -> LLMResponse:
        """Generate a response."""
        pass