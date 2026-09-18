"""add overall assessment

Revision ID: cbad1bcfe7b1
Revises: 79c6ee260cbb
Create Date: 2026-08-01 15:59:47.540059

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "cbad1bcfe7b1"
down_revision: Union[str, Sequence[str], None] = "79c6ee260cbb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Step 1: Add column as nullable
    op.add_column(
        "analysis_results",
        sa.Column(
            "overall_assessment",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    # Step 2: Fill existing rows with an empty JSON object
    op.execute("""
        UPDATE analysis_results
        SET overall_assessment = '{}'::jsonb
        WHERE overall_assessment IS NULL;
    """)

    # Step 3: Make column NOT NULL
    op.alter_column(
        "analysis_results",
        "overall_assessment",
        nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "analysis_results",
        "overall_assessment",
    )