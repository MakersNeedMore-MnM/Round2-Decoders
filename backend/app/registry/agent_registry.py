from app.agents.base import BaseAgent


class AgentRegistry:
    """
    Registry for all ProspectIQ agents.
    """

    def __init__(self):
        self._agents: dict[str, BaseAgent] = {}

    def register(self, agent: BaseAgent):
        self._agents[agent.name] = agent

    def get(self, name: str) -> BaseAgent:

        if name not in self._agents:
            raise ValueError(f"Agent '{name}' is not registered.")

        return self._agents[name]

    def list_agents(self) -> list[str]:
        return list(self._agents.keys())