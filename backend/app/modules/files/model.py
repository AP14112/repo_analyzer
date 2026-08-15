from datetime import datetime
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.modules.relationship.model import Relationship
from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.symbol.model import Symbol
from app.core.database import Base
from app.modules.repository.model import Repository


class File(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    repository_id: Mapped[int] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    relative_path: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    extension: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    language: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    repository: Mapped["Repository"] = relationship(
        back_populates="files"
    )
    symbols: Mapped[list["Symbol"]] = relationship(
    back_populates="file",
    cascade="all, delete-orphan",
    )
    relationships: Mapped[list["Relationship"]] = relationship(
    back_populates="file",
    cascade="all, delete-orphan",
    )