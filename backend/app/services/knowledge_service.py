from sqlalchemy.orm import Session

from app.models.knowledge_source import KnowledgeSource


class KnowledgeService:

    def save(
        self,
        db: Session,
        user_id: int,
        normalized_data: dict,
    ):

        source = KnowledgeSource(
            user_id=user_id,
            source_type=normalized_data["source_type"],
            source_name=normalized_data["source_name"],
            raw_content=normalized_data["content"],
            processed_data=normalized_data,
        )

        db.add(source)
        db.commit()
        db.refresh(source)

        return source