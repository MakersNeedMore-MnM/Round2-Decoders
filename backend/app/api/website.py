from pydantic import BaseModel

from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User

from app.services.assistant_service import AssistantService
from app.services.website_service import WebsiteService


router = APIRouter(
    prefix="/website",
    tags=["Website"],
)

assistant = AssistantService()

website = WebsiteService()


class WebsiteRequest(BaseModel):

    url: str


@router.post("/analyze")
async def analyze_website(
    request: WebsiteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    text = website.process(
        request.url,
    )

    return await assistant.analyze(
        text=text,
        current_user=current_user,
        db=db,
    )