from pydantic import BaseModel, HttpUrl
from uuid import UUID

class RepositoryAnalyzeResponse(BaseModel):
    repository_id: int
    github_url: str
    local_path: str
    status: str


class RepositoryAnalyzeRequest(BaseModel):
    repository_url: HttpUrl