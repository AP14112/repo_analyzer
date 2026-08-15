from pydantic import BaseModel


class GraphNodeResponse(BaseModel):
    id: int | None = None
    name: str | None = None
    kind: str | None = None
    relative_path: str | None = None
    language: str | None = None


class GraphRelationshipResponse(BaseModel):
    source: str
    relationship: str
    target: str