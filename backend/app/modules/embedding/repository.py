from sqlalchemy.orm import Session

from app.modules.chunk.model import CodeChunk
from app.modules.files.model import File


class EmbeddingRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_unembedded_chunks(
        self,
        limit: int | None = None,
    ) -> list[CodeChunk]:

        query = (
            self.db.query(CodeChunk)
            .filter(CodeChunk.embedding.is_(None))
            .order_by(CodeChunk.id)
        )

        if limit:
            query = query.limit(limit)

        return query.all()

    def update_embedding(
        self,
        chunk: CodeChunk,
        embedding: list[float],
    ) -> None:

        chunk.embedding = embedding
        self.db.add(chunk)

    def update_embeddings(
        self,
        chunks: list[CodeChunk],
        embeddings: list[list[float]],
    ) -> None:

        for chunk, embedding in zip(chunks, embeddings):
            chunk.embedding = embedding
            self.db.add(chunk)

        self.db.commit()
    def similarity_search(
    self,
    query_embedding: list[float],
    repository_id: int,
    limit: int = 10,
    ) -> list[dict]:

        distance = CodeChunk.embedding.cosine_distance(
            query_embedding
        )

        results = (
            self.db.query(
                CodeChunk,
                File,
                distance.label("distance"),
            )
            .join(
                File,
                CodeChunk.file_id == File.id,
            )
            .filter(
                File.repository_id == repository_id,
                CodeChunk.embedding.is_not(None),
            )
            .order_by(distance)
            .limit(limit)
            .all()
        )

        return [
            {
                "chunk_id": chunk.id,
                "file_id": file.id,
                "file_path": file.relative_path,
                "language": file.language,
                "symbol_id": chunk.symbol_id,
                "symbol_name": chunk.symbol_name,
                "chunk_type": chunk.chunk_type,
                "start_line": chunk.start_line,
                "end_line": chunk.end_line,
                "content": chunk.content,
                "distance": float(distance),
            }
            for chunk, file, distance in results
        ]