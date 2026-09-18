from app.website.scraper import WebsiteScraper


class WebsiteService:

    def process(
        self,
        url: str,
    ) -> str:

        return WebsiteScraper.scrape(url)