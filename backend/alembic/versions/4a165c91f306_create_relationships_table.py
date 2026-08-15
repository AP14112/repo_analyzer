"""create relationships table

Revision ID: 4a165c91f306
Revises: e0b5bf28dcc7
Create Date: 2026-08-01 18:48:17.942504

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a165c91f306'
down_revision: Union[str, Sequence[str], None] = 'e0b5bf28dcc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "relationships",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "file_id",
            sa.Integer(),
            sa.ForeignKey("files.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "source_symbol",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "target_symbol",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "relationship_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
    )

def downgrade() -> None:
    op.drop_table("relationships")