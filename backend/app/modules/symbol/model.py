from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.files.model import File


class Symbol(Base):
    __tablename__ = "symbols"

    id: Mapped[int] = mapped_column(primary_key=True)

    file_id: Mapped[int] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    kind: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    start_line: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    end_line: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    file: Mapped["File"] = relationship(
        back_populates="symbols",
    )