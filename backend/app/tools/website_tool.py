from app.tools.base import BaseTool
from app.website.scraper import WebsiteScraper


class WebsiteTool(BaseTool):

    name = "website"
    description = "Scrape a company's official website."

    async def execute(
        self,
        url: str,
    ):

        try:

            content = WebsiteScraper.scrape(
                url
            )

            return {
                "success": True,
                "url": url,
                "content": content,
            }

        except Exception as e:

            return {
                "success": False,
                "error": str(e),
            }