import os
from urllib import response
from app.core.config import settings
import httpx

from app.llm.base import BaseLLMProvider
from app.llm.schemas import LLMResponse


print(os.getcwd())
print(os.path.exists(".env"))


class OpenRouterProvider(BaseLLMProvider):

    def __init__(self):
        
        self.api_key = settings.OPENROUTER_API_KEY
       
        self.model = "qwen/qwen3-30b-a3b"

    async def generate(self, prompt: str) -> LLMResponse:

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost",
            "X-Title": "ProspectIQ",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }

        async with httpx.AsyncClient(timeout=120) as client:

            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
            )

            data = response.json()

            print("=" * 50)
            print("STATUS:", response.status_code)
            print(data)
            print("=" * 50)

            response.raise_for_status()

        return LLMResponse(
            content=data["choices"][0]["message"]["content"],
            provider="openrouter",
            model=self.model,
        )