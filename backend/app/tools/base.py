from abc import ABC, abstractmethod


class BaseTool(ABC):
    """
    Base class for every ProspectIQ tool.
    """

    name: str
    description: str

    @abstractmethod
    async def execute(self, **kwargs):
        """Execute the tool."""
        pass