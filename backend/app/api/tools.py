from fastapi import APIRouter

from app.core.context import context

router = APIRouter(
    prefix="/tools",
    tags=["Tools"],
)


@router.get("/")
async def list_tools():

    return {
        "tools": context.tool_registry.list_tools()
    }


@router.get("/calculate")
async def calculate(
    expression: str,
):

    return await context.tool_registry.execute(
        "calculator",
        expression=expression,
    )