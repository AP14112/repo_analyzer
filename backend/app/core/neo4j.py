from neo4j import GraphDatabase

from app.core.config import get_settings


class Neo4jConnection:

    def __init__(self):
        settings = get_settings()

        self.driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(
                settings.neo4j_username,
                settings.neo4j_password,
            ),
        )

    def verify_connection(self) -> None:
        self.driver.verify_connectivity()

    def close(self) -> None:
        self.driver.close()