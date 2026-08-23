from fastapi import APIRouter, Depends
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.repository.dependencies import get_repository_service
from app.modules.repository.model import Repository
from app.modules.repository.service import RepositoryService
from app.modules.repository.schema import (
    RepositoryAnalyzeRequest,
    RepositoryAnalyzeResponse,
)
from app.modules.repository.service import RepositoryService

router = APIRouter(
    prefix="/repositories",
    tags=["Repositories"],
)

@router.get("/")
def list_repositories(
    db: Session = Depends(get_db),
):
    repositories = (
        db.query(Repository)
        .order_by(Repository.created_at.desc())
        .all()
    )

    return [
        {
            "repository_id": repo.id,
            "github_url": repo.github_url,
            "local_path": repo.local_path,
            "status": repo.status.value,
            "created_at": repo.created_at,
        }
        for repo in repositories
    ]


@router.delete("/{repository_id}")
def delete_repository(
    repository_id: int,
    db: Session = Depends(get_db),
):
    repository = (
        db.query(Repository)
        .filter(Repository.id == repository_id)
        .first()
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    db.delete(repository)
    db.commit()

    return {
        "message": "Repository deleted successfully",
        "repository_id": repository_id,
    }

@router.post(
    "/analyze",
    response_model=RepositoryAnalyzeResponse,
)
async def analyze_repository(
    request: RepositoryAnalyzeRequest,
    repository_service: RepositoryService = Depends(get_repository_service),
):
   return repository_service.submit_repository(request)