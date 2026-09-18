from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.core.context import context
from app.models.user import User

router = APIRouter(
    prefix="/memory",
    tags=["Memory"],
)


@router.get("/")
async def get_memory(
    current_user: User = Depends(get_current_user),
):
    return context.memory.get_history(current_user.id)


@router.delete("/")
async def clear_memory(
    current_user: User = Depends(get_current_user),
):
    context.memory.clear(current_user.id)

    return {
        "message": "Memory cleared."
    }