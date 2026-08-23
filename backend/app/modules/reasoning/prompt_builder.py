class PromptBuilder:

    def build(
        self,
        query: str,
        context: str,
    ) -> tuple[str, str]:

        system_prompt = """
You are an AI engineering assistant that analyzes software repositories.

You must answer questions using ONLY the repository context provided to you.

Rules:
1. Do not invent code, files, symbols, or relationships.
2. If the context does not contain enough information, say so.
3. Reference relevant files, symbols, and line numbers when available.
4. Explain your reasoning clearly.
5. Prefer concrete evidence from the repository over general assumptions.
"""

        user_prompt = f"""
User question:

{query}

Repository context:

{context}

Analyze the repository context and answer the user's question.
"""

        return system_prompt, user_prompt