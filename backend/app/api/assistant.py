from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.services.assistant_service import AssistantService

router = APIRouter(
    prefix="/assistant",
    tags=["Assistant"],
)

service = AssistantService()


@router.post("/analyze")
async def analyze(
    text: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return await service.analyze(
        text=text,
        current_user=current_user,
        db=db,
    )