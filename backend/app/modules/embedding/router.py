from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
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