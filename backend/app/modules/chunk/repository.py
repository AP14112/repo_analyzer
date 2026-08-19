from sqlalchemy.orm import Session

from app.modules.chunk.model import CodeChunk


class CodeChunkRepository:

    def __init__(self, db: Session):
        self.db = db

    def bulk_create(
        self,
        chunks: list[CodeChunk],
    ) -> None:

        if not chunks:
            return

        self.db.add_all(chunks)
        self.db.commit()

    def get_by_file(
        self,
        file_id: int,
    ) -> list[CodeChunk]:

        return (
            self.db.query(CodeChunk)
            .filter(
                CodeChunk.file_id == file_id
            )
            .order_by(
                CodeChunk.start_line
            )
            .all()
        )