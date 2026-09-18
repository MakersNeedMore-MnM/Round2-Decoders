from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User

from app.services.assistant_service import AssistantService
from app.services.document_service import DocumentService

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
)

assistant = AssistantService()
document = DocumentService()


@router.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    text = document.process(file)

    return await assistant.analyze(
        text=text,
        current_user=current_user,
        db=db,
    )