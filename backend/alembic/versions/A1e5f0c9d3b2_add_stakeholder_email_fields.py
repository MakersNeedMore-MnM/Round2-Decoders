"""add stakeholder email fields to outreach_drafts

Revision ID: a1e5f0c9d3b2
Revises: 7b829f57fb9e
Create Date: 2026-08-15 17:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1e5f0c9d3b2"
down_revision: Union[str, Sequence[str], None] = "7b829f57fb9e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "outreach_drafts",
        sa.Column("stakeholder_email", sa.String(length=255), nullable=True),
    )

    op.add_column(
        "outreach_drafts",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "outreach_drafts",
        sa.Column("email_mx_domain", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column("outreach_drafts", "email_mx_domain")
    op.drop_column("outreach_drafts", "email_verified")
    op.drop_column("outreach_drafts", "stakeholder_email")