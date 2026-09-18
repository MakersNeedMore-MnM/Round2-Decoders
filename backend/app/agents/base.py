from abc import ABC, abstractmethod

from app.llm.manager import LLMManager
from app.tools.registry import ToolRegistry


class BaseAgent(ABC):
    """
    Base class for all ProspectIQ agents.
    """

    name: str
    description: str

    def __init__(
        self,
        llm: LLMManager,
        tools: ToolRegistry,
    ):
        self.llm = llm
        self.tools = tools

    @abstractmethod
    async def run(
        self,
        task: str,
        **kwargs,
    ):
        """
        Execute the agent. Implementations may accept extra keyword
        arguments (e.g. current_user, db) that only some agents need.
        """
        pass