from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.files.model import File


class Relationship(Base):
    __tablename__ = "relationships"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    file_id: Mapped[int] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
    )

    source_symbol: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    target_symbol: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    relationship_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    file: Mapped["File"] = relationship(
        back_populates="relationships",
    )