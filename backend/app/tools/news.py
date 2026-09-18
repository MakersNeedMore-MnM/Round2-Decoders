import os

from tavily import AsyncTavilyClient


class NewsTool:
    """
    Fetch latest news about a company.
    """

    name = "news"
    description = "Searches for recent company news."

    def __init__(self):
        self.client = AsyncTavilyClient(
            api_key=os.getenv("TAVILY_API_KEY")
        )

    async def execute(
        self,
        company: str,
    ):

        try:

            query = f"""
Latest news about {company}

Focus on:
- AI
- Hiring
- Partnerships
- Acquisitions
- Funding
- Products
- Business expansion
"""

            result = await self.client.search(
                query=query,
                topic="news",
                max_results=5,
            )

            return {
                "success": True,
                "results": result.get(
                    "results",
                    [],
                ),
            }

        except Exception as e:

            return {
                "success": False,
                "error": str(e),
            }