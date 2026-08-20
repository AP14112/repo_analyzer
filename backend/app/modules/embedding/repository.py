from sqlalchemy.orm import Session

from app.modules.chunk.model import CodeChunk


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
    limit: int = 10,
    ) -> list[tuple[CodeChunk, float]]:

        distance = CodeChunk.embedding.cosine_distance(
            query_embedding
        )

        results = (
            self.db.query(
                CodeChunk,
                distance.label("distance"),
            )
            .filter(CodeChunk.embedding.is_not(None))
            .order_by(distance)
            .limit(limit)
            .all()
        )

        return [
            (chunk, float(distance))
            for chunk, distance in results
        ]