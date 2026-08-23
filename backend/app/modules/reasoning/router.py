from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.reasoning.service import ReasoningService


router = APIRouter(
    prefix="/reasoning",
    tags=["Reasoning"],
)


class ReasoningRequest(BaseModel):
    query: str
    repository_id: int
    limit: int = 5


@router.post("/ask")
def ask_codebase(
    request: ReasoningRequest,
    db: Session = Depends(get_db),
):
    service = ReasoningService(db)

    return service.answer(
        query=request.query,
        repository_id=request.repository_id,
        limit=request.limit,
    )