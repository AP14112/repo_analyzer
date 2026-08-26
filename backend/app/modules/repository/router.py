from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.repository.dependencies import get_repository_service
from app.modules.repository.model import Repository
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
async def delete_repository(
    repository_id: int,
    db: Session = Depends(get_db),
):
    print(f"!!! INSIDE DELETE REPOSITORY for {repository_id} !!!")
    try:
        repository_service = RepositoryService(db)
        repository_service.delete_repository(repository_id)
        return {
            "message": "Repository deleted successfully",
            "repository_id": repository_id,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "type": str(type(e))}

@router.post(
    "/analyze",
    response_model=RepositoryAnalyzeResponse,
)
async def analyze_repository(
    request: RepositoryAnalyzeRequest,
    repository_service: RepositoryService = Depends(get_repository_service),
):
   return repository_service.submit_repository(request)

@router.get("/{repository_id}/stats")
async def get_repository_stats(
    repository_id: int,
    db: Session = Depends(get_db),
):
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Repository not found")
        
    from app.modules.files.model import File
    from app.modules.symbol.model import Symbol
    
    file_count = db.query(File).filter(File.repository_id == repository_id).count()
    
    # functions
    function_count = db.query(Symbol).join(File).filter(
        File.repository_id == repository_id, 
        Symbol.kind.in_(["function", "method"])
    ).count()
    
    # classes
    class_count = db.query(Symbol).join(File).filter(
        File.repository_id == repository_id, 
        Symbol.kind == "class"
    ).count()
    
    # languages
    languages = db.query(File.language).filter(File.repository_id == repository_id).distinct().all()
    primary_language = "Unknown"
    if languages and languages[0][0]:
        primary_language = languages[0][0]
        
    name = repo.github_url.rstrip('/').split('/')[-1]
        
    return {
        "repository_id": repo.id,
        "name": name,
        "github_url": repo.github_url,
        "language": primary_language,
        "file_count": file_count,
        "function_count": function_count,
        "class_count": class_count,
        "created_at": repo.created_at,
        "status": repo.status.value,
    }


