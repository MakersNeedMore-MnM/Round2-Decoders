from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.base import Base


class OAuthState(Base):
    __tablename__ = "oauth_states"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    state = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    code_verifier = Column(
        String(255),
        nullable=False,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    user = relationship(
        "User",
        backref="oauth_states",
    )