from sqlalchemy.orm import Session

from app.modules.files.model import File


class FileDAO:

    def __init__(self, db: Session):
        self.db = db

    def create(self, file: File) -> File:
        self.db.add(file)
        self.db.flush()
        return file

    def create_many(self, files: list[File]) -> list[File]:
        self.db.add_all(files)
        self.db.flush()
        return files

    def get_by_repository(self, repository_id: int) -> list[File]:
        return (
            self.db.query(File)
            .filter(File.repository_id == repository_id)
            .all()
        )

    def delete_by_repository(self, repository_id: int) -> None:
        (
            self.db.query(File)
            .filter(File.repository_id == repository_id)
            .delete()
        )