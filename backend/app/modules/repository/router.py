from fastapi import APIRouter, Depends

from app.modules.repository.dependencies import get_repository_service
from app.modules.repository.schema import (
    RepositoryAnalyzeRequest,
    RepositoryAnalyzeResponse,
)
from app.modules.repository.service import RepositoryService

router = APIRouter(
    prefix="/repositories",
    tags=["Repositories"],
)


@router.post(
    "/analyze",
    response_model=RepositoryAnalyzeResponse,
)
async def analyze_repository(
    request: RepositoryAnalyzeRequest,
    repository_service: RepositoryService = Depends(get_repository_service),
):
   return repository_service.submit_repository(request)