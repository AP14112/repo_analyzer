from app.modules.repository.model import Repository
from app.modules.files.model import File
from app.modules.symbol.model import Symbol
from app.modules.relationship.model import Relationship

from app.core.database import SessionLocal
from app.core.neo4j import Neo4jConnection
from app.modules.graph.service import Neo4jGraphService
from app.modules.symbol.repository import SymbolDAO


db = SessionLocal()

neo4j = Neo4jConnection()
neo4j.verify_connection()

graph_service = Neo4jGraphService(
    neo4j.driver
)

symbol_dao = SymbolDAO(db)

repository_id = 1

symbols = symbol_dao.get_by_repository(
    repository_id
)

print(
    f"Symbols found in PostgreSQL: {len(symbols)}"
)

graph_service.create_symbols(
    symbols
)

print("Symbols synced to Neo4j")

neo4j.close()
db.close()