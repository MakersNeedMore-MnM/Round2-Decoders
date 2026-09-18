import json
import re


class LLMJsonParser:
    """
    Shared JSON parser for all AI agents.

    Handles:
    - Markdown code blocks
    - LLMResponse objects
    - Dict responses
    - JSON parsing
    """

    @staticmethod
    def parse(response):

        # Support LLMResponse object
        if hasattr(response, "content"):
            content = response.content

        # Support dict response
        elif isinstance(response, dict):
            content = response.get("content", "")

        else:
            content = str(response)

        content = content.strip()

        # Remove markdown code fences
        content = re.sub(
            r"^```json",
            "",
            content,
            flags=re.IGNORECASE,
        )

        content = re.sub(
            r"^```",
            "",
            content,
        )

        content = re.sub(
            r"```$",
            "",
            content,
        )

        content = content.strip()

        return json.loads(content)