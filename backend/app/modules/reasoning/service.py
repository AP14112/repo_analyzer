from app.modules.embedding.search_service import EmbeddingSearchService
from app.modules.reasoning.context_builder import ContextBuilder
from app.modules.reasoning.prompt_builder import PromptBuilder
from app.modules.reasoning.llm_client import LLMClient


class ReasoningService:

    def __init__(self, db):
        self.search_service = EmbeddingSearchService(db)
        self.context_builder = ContextBuilder()
        self.prompt_builder = PromptBuilder()
        self.llm_client = LLMClient()

    def answer(
        self,
        query: str,
        repository_id: int,
        limit: int = 10,
    ) -> dict:

        # 1. Retrieve relevant code
        results = self.search_service.search(
            query=query,
            repository_id=repository_id,
            limit=limit,
        )

        # 2. Build repository context
        context = self.context_builder.build(
            search_results=results,
        )

        # 3. Build LLM prompt
        system_prompt, user_prompt = self.prompt_builder.build(
            query=query,
            context=context,
        )

        # 4. Ask Groq
        answer = self.llm_client.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        return {
            "query": query,
            "answer": answer,
            "sources": results,
        }