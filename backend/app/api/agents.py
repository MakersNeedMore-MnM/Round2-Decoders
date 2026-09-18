from fastapi import APIRouter

from app.core.context import context

router = APIRouter(
    prefix="/agents",
    tags=["Agents"],
)


@router.get("/")
async def list_agents():

    return {
        "agents": context.agent_registry.list_agents()
    }


@router.get("/research")
async def research(
    prompt: str,
):

    agent = context.agent_registry.get(
        "research"
    )

    return await agent.run(prompt)