"""add code chunk embeddings

Revision ID: ee979841b8a7
Revises: ffdd784306af
Create Date: 2026-08-19 16:52:41.675568

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = 'ee979841b8a7'
down_revision: Union[str, Sequence[str], None] = 'ffdd784306af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "code_chunks",
        sa.Column(
            "embedding",
            Vector(384),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "code_chunks",
        "embedding",
    )
