from sentence_transformers import SentenceTransformer


class EmbeddingModel:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        return cls._instance

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    ):
        # Initialization happens in __new__
        pass

    def generate_embeddings(
        self,
        texts: list[str],
    ) -> list[list[float]]:

        if not texts:
            return []

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
        )

        return embeddings.tolist()

    def generate_embedding(
        self,
        text: str,
    ) -> list[float]:

        return self.generate_embeddings([text])[0]