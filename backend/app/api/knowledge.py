from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.knowledge_ingestion.agent import KnowledgeIngestionAgent
from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.services.knowledge_service import KnowledgeService

router = APIRouter(
    prefix="/knowledge",
    tags=["Knowledge"],
)

agent = KnowledgeIngestionAgent()
service = KnowledgeService()


@router.post("/ingest")
async def ingest(
    text: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    normalized = await agent.ingest(
        text=text,
    )

    record = service.save(
        db,
        current_user.id,
        normalized,
    )

    return {
        "id": record.id,
        "status": "stored",
        "data": normalized,
    }