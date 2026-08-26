from sqlalchemy.orm import Session

from app.modules.relationship.model import Relationship


class RelationshipDAO:

    def __init__(self, db: Session):
        self.db = db

    def create(self, relationship: Relationship) -> Relationship:
        self.db.add(relationship)
        self.db.flush()
        return relationship

    def bulk_create(
        self,
        relationships: list[Relationship],
    ) -> None:
        if relationships:
            self.db.add_all(relationships)
            self.db.flush()
    def get_by_file_repository(
        self,
        repository_id: int,
    ) -> list[Relationship]:

        return (
            self.db.query(Relationship)
            .join(Relationship.file)
            .filter(
                Relationship.file.has(
                    repository_id=repository_id
                )
            )
            .all()
        )
    def get_by_repository(
        self,
        repository_id: int,
    ) -> list[Relationship]:

        return (
            self.db.query(Relationship)
            .join(Relationship.file)
            .filter(
                Relationship.file.has(
                    repository_id=repository_id
                )
            )
            .all()
        )
