from app.tools.base import BaseTool


class ToolRegistry:

    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool):

        self._tools[tool.name] = tool

    def get(self, name: str):

        if name not in self._tools:
            raise ValueError(f"Tool '{name}' not found.")

        return self._tools[name]

    async def execute(
        self,
        tool_name: str,
        **kwargs,
    ):

        tool = self.get(tool_name)

        return await tool.execute(**kwargs)

    def list_tools(self):

        return list(self._tools.keys())