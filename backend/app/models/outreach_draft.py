from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class OutreachDraft(Base):
    """
    A generated (and human-approved/rejected) outreach message tied back
    to the analysis that produced it, so every draft is traceable to the
    evidence that grounded it.
    """

    __tablename__ = "outreach_drafts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
    )

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("analysis_results.id"),
        nullable=False,
    )

    stakeholder_name: Mapped[str] = mapped_column(
        String(255),
        default="",
    )

    stakeholder_email: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        default=None,
    )

    email_verified: Mapped[bool] = mapped_column(
        default=False,
    )

    email_mx_domain: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        default=None,
    )

    channel: Mapped[str] = mapped_column(
        String(50),
        default="email",
    )

    subject: Mapped[str] = mapped_column(
        String(500),
        default="",
    )

    body: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    confidence: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    reasoning: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    evidence: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    company = relationship("Company")