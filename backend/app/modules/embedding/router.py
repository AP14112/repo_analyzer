from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.embedding.search_service import EmbeddingSearchService
from app.modules.embedding.service import EmbeddingService


router = APIRouter(
    prefix="/embeddings",
    tags=["Embeddings"],
)


@router.post("/generate")
def generate_embeddings(
    db: Session = Depends(get_db),
):
    service = EmbeddingService(db)

    processed = service.generate_embeddings()

    return {
        "status": "success",
        "chunks_embedded": processed,
    }


@router.get("/search")
def search_code(
    repository_id: int,
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    service = EmbeddingSearchService(db)

    results = service.search(
        repository_id=repository_id,
        query=q,
        limit=limit,
    )

    return {
        "query": q,
        "results": results,
    }