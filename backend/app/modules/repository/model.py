from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.repository.enums import RepositoryStatus

if TYPE_CHECKING:
    from app.modules.files.model import File


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    github_url: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    local_path: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    status: Mapped[RepositoryStatus] = mapped_column(
        Enum(RepositoryStatus),
        default=RepositoryStatus.PENDING,
        nullable=False,
    )

    commit_hash: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    files: Mapped[list["File"]] = relationship(
        back_populates="repository",
        cascade="all, delete-orphan",
    )