from fastapi import APIRouter

from app.core.context import context

router = APIRouter(
    prefix="/llm",
    tags=["LLM"],
)


@router.get("/test")
async def test_llm():

    return await context.llm.generate(
        prompt="Introduce yourself in two lines."
    )


@router.get("/providers")
async def providers():

    return {
        "providers": context.provider_registry.list_providers()
    }