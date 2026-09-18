from datetime import datetime

from app.tools.base import BaseTool


class WeatherTool(BaseTool):
    """
    Demo Weather Tool.
    """

    name = "weather"

    description = "Returns demo weather information."

    async def execute(self, city: str):

        return {
            "success": True,
            "city": city,
            "temperature": "30°C",
            "condition": "Sunny",
            "timestamp": datetime.now().isoformat(),
        }