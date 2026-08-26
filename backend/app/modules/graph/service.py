from neo4j import Driver

from app.modules.files.model import File
from app.modules.relationship.model import Relationship
from app.modules.symbol.model import Symbol


class Neo4jGraphService:

    def __init__(self, driver: Driver):
        self.driver = driver

    # --------------------------------------------------
    # Repository
    # --------------------------------------------------

    def create_repository(
        self,
        repository_id: int,
        github_url: str,
    ) -> None:

        query = """
        MERGE (r:Repository {id: $repository_id})

        SET r.github_url = $github_url
        """

        with self.driver.session() as session:
            session.run(
                query,
                repository_id=repository_id,
                github_url=github_url,
            )

    # --------------------------------------------------
    # Files
    # --------------------------------------------------

    def create_file(
        self,
        repository_id: int,
        file_id: int,
        relative_path: str,
        language: str,
    ) -> None:

        query = """
        MATCH (r:Repository {id: $repository_id})

        MERGE (f:File {id: $file_id})

        SET
            f.relative_path = $relative_path,
            f.language = $language

        MERGE (r)-[:CONTAINS]->(f)
        """

        with self.driver.session() as session:
            session.run(
                query,
                repository_id=repository_id,
                file_id=file_id,
                relative_path=relative_path,
                language=language,
            )

    # --------------------------------------------------
    # Symbols
    # --------------------------------------------------

    def create_symbols(
        self,
        symbols: list[Symbol],
    ) -> None:

        if not symbols:
            return

        symbol_data = [
            {
                "id": symbol.id,
                "file_id": symbol.file_id,
                "name": symbol.name,
                "kind": symbol.kind,
                "start_line": symbol.start_line,
                "end_line": symbol.end_line,
            }
            for symbol in symbols
        ]

        query = """
        UNWIND $symbols AS symbol

        MATCH (f:File {id: symbol.file_id})

        MERGE (s:Symbol {id: symbol.id})

        SET
            s.name = symbol.name,
            s.kind = symbol.kind,
            s.start_line = symbol.start_line,
            s.end_line = symbol.end_line,
            s.file_id = symbol.file_id

        MERGE (f)-[:CONTAINS]->(s)
        """

        with self.driver.session() as session:
            session.run(
                query,
                symbols=symbol_data,
            )

    # --------------------------------------------------
    # IMPORTS
    # --------------------------------------------------

    def create_imports(
        self,
        relationships: list[dict],
    ) -> None:

        if not relationships:
            return

        query = """
        UNWIND $relationships AS rel

        MATCH (f:File {id: rel.file_id})

        MERGE (m:Module {name: rel.target_symbol})

        MERGE (f)-[:IMPORTS]->(m)
        """

        with self.driver.session() as session:
            session.run(
                query,
                relationships=relationships,
            )

    # --------------------------------------------------
    # INHERITS
    # --------------------------------------------------

    def create_inheritance_relationships(
    self,
    relationships: list[dict],
    ) -> None:

        if not relationships:
            return

        query = """
        UNWIND $relationships AS rel
        MATCH (source:Symbol {id: rel.source_id})
        MATCH (target:Symbol {id: rel.target_id})
        MERGE (source)-[:INHERITS]->(target)
        """

        with self.driver.session() as session:
            session.run(
                query,
                relationships=relationships,
            )
    # --------------------------------------------------
    # COMPLETE REPOSITORY GRAPH SYNC
    # --------------------------------------------------
        # --------------------------------------------------
    # CALLS
    # --------------------------------------------------

    def create_call_relationships(
        self,
        relationships: list[dict],
    ) -> None:

        if not relationships:
            return

        query = """
        UNWIND $relationships AS rel
        MATCH (source:Symbol {id: rel.source_id})
        MATCH (target:Symbol {id: rel.target_id})
        MERGE (source)-[:CALLS]->(target)
        """

        with self.driver.session() as session:
            session.run(
                query,
                relationships=relationships,
            )

    def delete_repository_graph(self, repository_id: int) -> None:
        """Delete only nodes owned by one repository."""
        query = """
        MATCH (r:Repository {id: $repository_id})-[:CONTAINS]->(f:File)
        OPTIONAL MATCH (f)-[:CONTAINS]->(s:Symbol)
        WITH r, collect(DISTINCT f) + collect(DISTINCT s) AS nodes
        FOREACH (node IN nodes | DETACH DELETE node)
        DETACH DELETE r
        """
        with self.driver.session() as session:
            session.run(query, repository_id=repository_id).consume()

    def sync_repository_graph(
        self,
        repository_id: int,
        github_url: str,
        files: list[File],
        symbols: list[Symbol],
        relationships: list[Relationship],
    ) -> None:

        # --------------------------------------------------
        # 1. Repository
        # --------------------------------------------------

        self.create_repository(
            repository_id=repository_id,
            github_url=github_url,
        )

        # --------------------------------------------------
        # 2. Files
        # --------------------------------------------------

        for file in files:

            self.create_file(
                repository_id=repository_id,
                file_id=file.id,
                relative_path=file.relative_path,
                language=file.language,
            )

        # --------------------------------------------------
        # 3. Symbols
        # --------------------------------------------------

        self.create_symbols(
            symbols
        )

        # --------------------------------------------------
        # 4. Separate relationships
        # --------------------------------------------------

        imports = [
            {
                "file_id": relationship.file_id,
                "target_symbol": relationship.target_symbol,
            }
            for relationship in relationships
            if relationship.relationship_type == "IMPORTS"
        ]

        # The relational model stores names rather than target IDs.  Resolve a
        # name only in its file, or when it is unique in this repository; never
        # turn an ambiguous name in another file into a graph edge.
        by_file_and_name: dict[tuple[int, str], list[int]] = {}
        by_name: dict[str, list[int]] = {}
        for symbol in symbols:
            by_file_and_name.setdefault((symbol.file_id, symbol.name), []).append(symbol.id)
            by_name.setdefault(symbol.name, []).append(symbol.id)

        def resolve(kind: str) -> list[dict]:
            edges: list[dict] = []
            for relationship in relationships:
                if relationship.relationship_type != kind:
                    continue
                sources = by_file_and_name.get((relationship.file_id, relationship.source_symbol), [])
                targets = by_file_and_name.get((relationship.file_id, relationship.target_symbol), [])
                if not targets:
                    candidates = by_name.get(relationship.target_symbol, [])
                    targets = candidates if len(candidates) == 1 else []
                if len(sources) == 1 and len(targets) == 1:
                    edges.append({"source_id": sources[0], "target_id": targets[0]})
            return edges

        inheritance = resolve("INHERITS")
        calls = resolve("CALLS")

        # --------------------------------------------------
        # 5. IMPORTS
        # --------------------------------------------------

        self.create_imports(
            imports
        )

        # --------------------------------------------------
        # 6. INHERITS
        # --------------------------------------------------

        self.create_inheritance_relationships(
            inheritance
        )

        # --------------------------------------------------
        # 7. CALLS
        # --------------------------------------------------

        self.create_call_relationships(
            calls
        )
