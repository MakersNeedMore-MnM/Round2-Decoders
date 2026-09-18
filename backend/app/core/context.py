from app.agents.research_v2 import ResearchAgentV2
from app.agents.sales_analysis_agent import SalesAnalysisAgent

from app.llm.gemini_provider import GeminiProvider
from app.llm.groq_provider import GroqProvider
from app.llm.manager import LLMManager
from app.llm.ollama_provider import OllamaProvider

from app.registry.agent_registry import AgentRegistry
from app.registry.provider_registry import ProviderRegistry

from app.tools.registry import ToolRegistry

from app.tools.calculator import CalculatorTool
from app.tools.weather import WeatherTool
from app.tools.search import SearchTool
from app.tools.news import NewsTool
from app.tools.website_tool import WebsiteTool

from app.memory.memory import Memory
from app.llm.openrouter_provider import OpenRouterProvider


class AppContext:
    """
    Shared application context.

    Initializes all providers, tools,
    agents and memory exactly once.
    """

    def __init__(self):

        # ==========================================
        # Provider Registry
        # ==========================================

        self.provider_registry = ProviderRegistry()

        self.provider_registry.register(
            "groq",
            GroqProvider(),
        )

        self.provider_registry.register(
            "gemini",
            GeminiProvider(),
        )

        self.provider_registry.register(
            "ollama",
            OllamaProvider(),
        )

        self.provider_registry.register(
            "openrouter",
            OpenRouterProvider(),
        )

        # ==========================================
        # LLM Manager
        # ==========================================

        self.llm = LLMManager(
            self.provider_registry,
        )

        # ==========================================
        # Tool Registry
        # ==========================================

        self.tool_registry = ToolRegistry()

        self.tool_registry.register(CalculatorTool())

        self.tool_registry.register(WeatherTool())

        self.tool_registry.register(SearchTool())

        self.tool_registry.register(NewsTool())

        self.tool_registry.register(WebsiteTool())

        # ==========================================
        # Agent Registry
        # ==========================================

        self.agent_registry = AgentRegistry()

        self.agent_registry.register(
            ResearchAgentV2(
                self.llm,
                self.tool_registry,
            )
        )

        self.agent_registry.register(
            SalesAnalysisAgent(
                self.llm,
                self.tool_registry,
            )
        )

        # ==========================================
        # Memory
        # ==========================================

        self.memory = Memory()


# Singleton
context = AppContext()
