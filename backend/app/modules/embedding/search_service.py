from sqlalchemy.orm import Session

from app.modules.embedding.model import EmbeddingModel
from app.modules.embedding.repository import EmbeddingRepository
from app.modules.graph.repository import GraphRepository
from app.core.neo4j import Neo4jConnection as Neo4jDatabase


class EmbeddingSearchService:

    def __init__(self, db: Session):

        self.repository = EmbeddingRepository(db)
        self.model = EmbeddingModel()

        self.neo4j = Neo4jDatabase()
        self.graph_repository = GraphRepository(
            self.neo4j.driver
        )

    def search(
        self,
        query: str,
        repository_id: int,
        limit: int = 10,
    ) -> list[dict]:

        # 1. Convert natural-language query to vector
        query_embedding = self.model.generate_embedding(
            query
        )

        # 2. Search PostgreSQL using vector similarity
        results = self.repository.similarity_search(
            query_embedding=query_embedding,
            repository_id=repository_id,
            limit=limit,
        )

        final_results = []

        # 3. Enrich vector results with graph context
        for result in results:

            graph_context = None

            if result["symbol_id"] is not None:

                graph_context = (
                    self.graph_repository.get_symbol_context(
                        result["symbol_id"]
                    )
                )

            final_results.append(
                {
                    **result,
                    "graph_context": graph_context,
                }
            )

        return final_results