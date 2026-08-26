import json
import logging
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

    def _resolve_symbol_by_name(self, repository_id: int, file_path: str, symbol_name: str):
        if not symbol_name or not file_path:
            return None
            
        query = """
        MATCH (r:Repository {id: $repository_id})-[:CONTAINS]->(f:File {relative_path: $file_path})-[:CONTAINS]->(s:Symbol {name: $symbol_name})
        RETURN s.id AS symbol_id
        LIMIT 1
        """
        
        with self.neo4j.driver.session() as session:
            record = session.run(
                query,
                repository_id=repository_id,
                file_path=file_path.replace("\\", "/"),  # Normalize for graph lookup
                symbol_name=symbol_name
            ).single()
            
            if not record:
                # Try just by file_path suffix if exact match fails
                query_fallback = """
                MATCH (r:Repository {id: $repository_id})-[:CONTAINS]->(f:File)-[:CONTAINS]->(s:Symbol {name: $symbol_name})
                WHERE f.relative_path ENDS WITH $file_path_suffix
                RETURN s.id AS symbol_id
                LIMIT 1
                """
                record = session.run(
                    query_fallback,
                    repository_id=repository_id,
                    file_path_suffix="/" + file_path.split("/")[-1].split("\\")[-1],
                    symbol_name=symbol_name
                ).single()
                
            if record:
                return record["symbol_id"]
        return None

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

        # 2. Search PostgreSQL using vector similarity (fetch extra for reranking)
        raw_results = self.repository.similarity_search(
            query_embedding=query_embedding,
            repository_id=repository_id,
            limit=limit * 4,
        )

        # 3. Rerank to penalize tests unless query asks for tests
        is_test_query = "test" in query.lower()
        seen = set()
        unique_results = []
        
        for r in raw_results:
            # Deduplicate by file_path and symbol_name
            sig = (r["file_path"], r["symbol_name"])
            if sig in seen:
                continue
            seen.add(sig)
            
            # Penalize tests
            is_test_file = "test" in r["file_path"].lower() or "tests" in r["file_path"].lower()
            if is_test_file and not is_test_query:
                r["distance"] += 0.15  # Penalty
                
            unique_results.append(r)
            
        unique_results.sort(key=lambda x: x["distance"])
        results = unique_results[:limit]

        final_results = []

        # 4. Enrich vector results with graph context
        for result in results:

            graph_context = None
            symbol_id = result["symbol_id"]

            if symbol_id is None and result["symbol_name"]:
                # Attempt to resolve the symbol in Neo4j if Postgres missed it
                symbol_id = self._resolve_symbol_by_name(
                    repository_id, 
                    result["file_path"], 
                    result["symbol_name"]
                )
                if symbol_id is not None:
                    result["symbol_id"] = symbol_id  # Update it in the result

            if symbol_id is not None:
                graph_context = (
                    self.graph_repository.get_symbol_context(
                        symbol_id
                    )
                )

            final_results.append(
                {
                    **result,
                    "graph_context": graph_context,
                }
            )

        return final_results