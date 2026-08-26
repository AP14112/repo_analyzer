from sqlalchemy.orm import Session

from app.modules.embedding.model import EmbeddingModel
from app.modules.embedding.repository import EmbeddingRepository


class EmbeddingService:

    def __init__(
        self,
        db: Session,
    ):
        self.repository = EmbeddingRepository(db)
        self.embedding_model = EmbeddingModel()

    def generate_embeddings(
        self,
        batch_size: int = 32,
    ) -> int:

        total_processed = 0

        while True:

            chunks = self.repository.get_unembedded_chunks(
                limit=batch_size
            )

            if not chunks:
                break

            texts = [
                chunk.content
                for chunk in chunks
            ]

            embeddings = self.embedding_model.generate_embeddings(
                texts
            )

            self.repository.update_embeddings(
                chunks,
                embeddings,
            )

            total_processed += len(chunks)

            print(
                f"Embedded {total_processed} chunks"
            )

        return total_processed