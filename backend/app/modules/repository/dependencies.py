from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.repository.service import RepositoryService


def get_repository_service(
    db: Session = Depends(get_db),
) -> RepositoryService:
    return RepositoryService(db)