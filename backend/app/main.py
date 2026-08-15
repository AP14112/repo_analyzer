from fastapi import FastAPI
import uvicorn
from app.core.config import get_settings
from app.modules.repository.router import router as repository_router
from app.core.exception_handlers import register_exception_handlers


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
register_exception_handlers(app)



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

