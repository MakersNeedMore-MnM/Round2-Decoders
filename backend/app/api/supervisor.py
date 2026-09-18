from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.supervisor.service import SupervisorService

router = APIRouter(
    prefix="/supervisor",
    tags=["Supervisor"],
)

service = SupervisorService()


@router.post("/execute")
async def execute(
    prompt: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await service.execute(prompt, current_user, db)