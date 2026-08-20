from app.modules.embedding.service import EmbeddingService


service = EmbeddingService()

text = """
def calculate_total(items):
    return sum(items)
"""

embedding = service.generate_embedding(text)

print("Embedding dimensions:", len(embedding))
print("First 5 values:", embedding[:5])