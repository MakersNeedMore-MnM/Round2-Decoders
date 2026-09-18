from tavily import TavilyClient

from app.core.config import settings
from app.tools.base import BaseTool


class SearchTool(BaseTool):
    name = "search"
    description = "Search the web."

    def __init__(self):
        self.client = TavilyClient(api_key=settings.TAVILY_API_KEY)

    async def execute(self, query: str):

        try:
            response = self.client.search(
                query=query,
                search_depth="basic",
                max_results=5,
            )

            return {
                "success": True,
                "query": query,
                "results": response["results"],
            }

        except Exception as e:

            return {
                "success": False,
                "error": str(e),
            }