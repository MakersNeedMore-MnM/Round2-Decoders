from fastapi import APIRouter

from app.router.service import RouterService
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    GoogleLogin,
)

router = APIRouter(
    prefix="/router",
    tags=["Router"],
)

service = RouterService()


@router.get("/route")
async def route(
    prompt: str,
):

    return await service.execute(prompt)