from pydantic import BaseModel


class LLMResponse(BaseModel):
    """Standard response returned by every LLM provider."""

    content: str

    provider: str

    model: str

    tokens: int | None = None

    latency: float | None = None