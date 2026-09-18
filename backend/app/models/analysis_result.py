from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    knowledge_id: Mapped[int] = mapped_column(
        ForeignKey("knowledge_sources.id"),
        nullable=False,
    )

    # NEW
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
    )

    persona: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    intent: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    strategy: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    guardrail: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    overall_assessment: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    timeline: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    execution: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    # NEW
    company = relationship(
        "Company",
        back_populates="analyses",
    )