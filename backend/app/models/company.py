from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    website: Mapped[str] = mapped_column(
        String(255),
        default="",
    )

    industry: Mapped[str] = mapped_column(
        String(255),
        default="",
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    analyses = relationship(
        "AnalysisResult",
        back_populates="company",
        cascade="all, delete-orphan",

    )