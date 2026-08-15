from fastapi import APIRouter

from schemas.repo_sch import (
    RepositoryAnalyzeRequest,
    RepositoryAnalyzeResponse,
)


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
) -> RepositoryAnalyzeResponse:

    return RepositoryAnalyzeResponse(
        repository_url=str(request.repository_url),
        status="accepted",
        message="Repository analysis request accepted.",
    )