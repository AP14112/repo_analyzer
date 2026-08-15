from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.repository.model import Repository
from app.modules.repository.enums import RepositoryStatus


class RepositoryDAO:

    def __init__(self, db: Session):
        self.db = db

    def create(self, repository: Repository) -> Repository:
        self.db.add(repository)
        self.db.commit()
        self.db.refresh(repository)
        return repository

    def get_by_id(self, repository_id: UUID) -> Repository | None:
        return (
            self.db.query(Repository)
            .filter(Repository.id == repository_id)
            .first()
        )

    def get_by_github_url(self, github_url: str) -> Repository | None:
        return (
            self.db.query(Repository)
            .filter(Repository.github_url == github_url)
            .first()
        )

    def update(
        self,
        repository: Repository,
    ) -> Repository:
        self.db.commit()
        self.db.refresh(repository)
        return repository

    def delete(self, repository: Repository) -> None:
        self.db.delete(repository)
        self.db.commit()