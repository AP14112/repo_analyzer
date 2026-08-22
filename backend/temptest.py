from app.core.neo4j import Neo4jConnection
from app.modules.graph.repository import GraphRepository


db = Neo4jConnection()

repository = GraphRepository(db.driver)

result = repository.get_symbol_context(3291)

print("\n================ GRAPH CONTEXT ================\n")
print(result)

db.driver.close()