

from neo4j import Driver

class GraphRepository:

    def __init__(self, driver: Driver):
        self.driver = driver

    # --------------------------------------------------
    # Repository
    # --------------------------------------------------

    def get_repository(
        self,
        repository_id: int,
    ):
        
        query = """
        MATCH (r:Repository {id: $repository_id})
        RETURN r
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                repository_id=repository_id,
            )

            record = result.single()

            if record is None:
                return None

            return record["r"]

    # --------------------------------------------------
    # Files
    # --------------------------------------------------

    def get_files(
        self,
        repository_id: int,
    ):

        query = """
        MATCH (r:Repository {id: $repository_id})
              -[:CONTAINS]->
              (f:File)

        RETURN f
        ORDER BY f.relative_path
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                repository_id=repository_id,
            )

            return [
                record["f"]
                for record in result
            ]

    # --------------------------------------------------
    # Symbols
    # --------------------------------------------------

    def get_symbols(
        self,
        file_id: int,
    ):

        query = """
        MATCH (f:File {id: $file_id})
              -[:CONTAINS]->
              (s:Symbol)

        RETURN s
        ORDER BY s.start_line
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                file_id=file_id,
            )

            return [
                record["s"]
                for record in result
            ]

    # --------------------------------------------------
    # CALLERS
    # --------------------------------------------------

    def get_callers(
        self,
        symbol_id: int,
    ):

        query = """
        MATCH (caller:Symbol)-[:CALLS]->
              (target:Symbol {id: $symbol_id})

        RETURN caller
        ORDER BY caller.name
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                symbol_id=symbol_id,
            )

            return [
                record["caller"]
                for record in result
            ]

    # --------------------------------------------------
    # CALLEES
    # --------------------------------------------------

    def get_callees(
        self,
        symbol_id: int,
    ):

        query = """
        MATCH (source:Symbol {id: $symbol_id})
              -[:CALLS]->
              (callee:Symbol)

        RETURN callee
        ORDER BY callee.name
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                symbol_id=symbol_id,
            )

            return [
                record["callee"]
                for record in result
            ]

    # --------------------------------------------------
    # DEPENDENCIES
    # --------------------------------------------------

    def get_dependencies(
        self,
        file_id: int,
    ):

        query = """
        MATCH (f:File {id: $file_id})
              -[:IMPORTS]->
              (m:Module)

        RETURN m
        ORDER BY m.name
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                file_id=file_id,
            )

            return [
                record["m"]
                for record in result
            ]

    # --------------------------------------------------
    # INHERITANCE
    # --------------------------------------------------

    def get_parent_classes(
        self,
        symbol_id: int,
    ):

        query = """
        MATCH (child:Symbol {id: $symbol_id})
              -[:INHERITS]->
              (parent:Symbol)

        RETURN parent
        ORDER BY parent.name
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                symbol_id=symbol_id,
            )

            return [
                record["parent"]
                for record in result
            ]

    def get_child_classes(
        self,
        symbol_id: int,
    ):

        query = """
        MATCH (child:Symbol)
              -[:INHERITS]->
              (parent:Symbol {id: $symbol_id})

        RETURN child
        ORDER BY child.name
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                symbol_id=symbol_id,
            )

            return [
                record["child"]
                for record in result
            ]
            # --------------------------------------------------
    # SYMBOL CONTEXT
    # --------------------------------------------------

    def get_symbol_context(
        self,
        symbol_id: int,
    ):

        query = """
        MATCH (s:Symbol {id: $symbol_id})

        OPTIONAL MATCH (caller:Symbol)-[:CALLS]->(s)
        OPTIONAL MATCH (s)-[:CALLS]->(callee:Symbol)
        OPTIONAL MATCH (s)-[:INHERITS]->(parent:Symbol)
        OPTIONAL MATCH (child:Symbol)-[:INHERITS]->(s)

        RETURN
            s,

            collect(DISTINCT caller) AS callers,
            collect(DISTINCT callee) AS callees,
            collect(DISTINCT parent) AS parents,
            collect(DISTINCT child) AS children
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                symbol_id=symbol_id,
            )

            record = result.single()

            if record is None:
                return None

            return {
                "symbol": self._node_to_dict(record["s"]),
                "callers": [
                    self._node_to_dict(node)
                    for node in record["callers"]
                    if node is not None
                ],
                "callees": [
                    self._node_to_dict(node)
                    for node in record["callees"]
                    if node is not None
                ],
                "parents": [
                    self._node_to_dict(node)
                    for node in record["parents"]
                    if node is not None
                ],
                "children": [
                    self._node_to_dict(node)
                    for node in record["children"]
                    if node is not None
                ],
            }
    def _node_to_dict(self, node):
        return dict(node)