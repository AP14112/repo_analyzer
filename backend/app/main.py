from fastapi import FastAPI
import uvicorn
from app.core.config import get_settings
from app.modules.repository.router import router as repository_router
from app.core.exception_handlers import register_exception_handlers
from app.modules.graph.router import router as graph_router
from app.modules.embedding.router import router as embedding_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.reasoning.router import router as reasoning_router





settings=get_settings()
app = FastAPI(
    title=settings.app_name,
    description=(
        "A repository intelligence platform powered by static analysis, "
        "knowledge graphs, hybrid search, and LLM reasoning."
    ),
    version=settings.app_version,
)
app.include_router(repository_router)
app.include_router(graph_router)
app.include_router(embedding_router)
app.include_router(reasoning_router)
register_exception_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
async def root():
    return {
        "message": "AI Engineering Intelligence Platform API",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
    }

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)

