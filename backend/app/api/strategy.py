from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.strategy.agent import StrategyAgent
from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.knowledge_source import KnowledgeSource
from app.models.user import User

router = APIRouter(
    prefix="/strategy",
    tags=["Strategy"],
)

agent = StrategyAgent()


@router.post("/generate/{knowledge_id}")
async def generate_strategy(
    knowledge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    record = (
        db.query(KnowledgeSource)
        .filter(
            KnowledgeSource.id == knowledge_id,
            KnowledgeSource.user_id == current_user.id,
        )
        .first()
    )

    if record is None:
        return {
            "error": "Knowledge not found"
        }

    strategy = await agent.generate(
        record.processed_data["knowledge"]
    )

    return strategy