from fastapi import APIRouter

from app.planner.service import PlannerService
from fastapi import Depends

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/planner",
    tags=["Planner"],
)

planner = PlannerService()


@router.get("/plan")
async def plan(
    prompt: str,
    current_user: User = Depends(get_current_user)
):

    return await planner.execute(prompt)