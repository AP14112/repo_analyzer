from pydantic import BaseModel, HttpUrl


class RepositoryAnalyzeRequest(BaseModel):
    repository_url: HttpUrl


class RepositoryAnalyzeResponse(BaseModel):
    repository_url: str
    status: str
    message: str