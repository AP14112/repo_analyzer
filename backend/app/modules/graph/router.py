from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.neo4j import Neo4jConnection
from app.modules.graph.repository import GraphRepository


router = APIRouter(
    prefix="/graph",
    tags=["Graph"],
)


def get_graph_repository() -> GraphRepository:
    neo4j = Neo4jConnection()

    return GraphRepository(
        neo4j.driver
    )


@router.get("/repositories/{repository_id}")
def get_repository_graph(
    repository_id: int,
    graph_repository: GraphRepository = Depends(
        get_graph_repository
    ),
):

    repository = graph_repository.get_repository(
        repository_id
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found.",
        )

    files = graph_repository.get_files(
        repository_id
    )

    return {
        "repository": dict(repository),
        "files": [
            dict(file)
            for file in files
        ],
    }


@router.get("/files/{file_id}/symbols")
def get_file_symbols(
    file_id: int,
    graph_repository: GraphRepository = Depends(
        get_graph_repository
    ),
):

    symbols = graph_repository.get_symbols(
        file_id
    )

    return {
        "file_id": file_id,
        "symbols": [
            dict(symbol)
            for symbol in symbols
        ],
    }


@router.get("/symbols/{symbol_id}/callers")
def get_symbol_callers(
    symbol_id: int,
    graph_repository: GraphRepository = Depends(
        get_graph_repository
    ),
):

    callers = graph_repository.get_callers(
        symbol_id
    )

    return {
        "symbol_id": symbol_id,
        "callers": [
            dict(symbol)
            for symbol in callers
        ],
    }


@router.get("/symbols/{symbol_id}/callees")
def get_symbol_callees(
    symbol_id: int,
    graph_repository: GraphRepository = Depends(
        get_graph_repository
    ),
):

    callees = graph_repository.get_callees(
        symbol_id
    )

    return {
        "symbol_id": symbol_id,
        "callees": [
            dict(symbol)
            for symbol in callees
        ],
    }


@router.get("/files/{file_id}/dependencies")
def get_file_dependencies(
    file_id: int,
    graph_repository: GraphRepository = Depends(
        get_graph_repository
    ),
):

    dependencies = graph_repository.get_dependencies(
        file_id
    )

    return {
        "file_id": file_id,
        "dependencies": [
            dict(module)
            for module in dependencies
        ],
    }


@router.get("/symbols/{symbol_id}/parents")
def get_parent_classes(
    symbol_id: int,
    graph_repository: GraphRepository = Depends(
        get_graph_repository
    ),
):

    parents = graph_repository.get_parent_classes(
        symbol_id
    )

    return {
        "symbol_id": symbol_id,
        "parents": [
            dict(symbol)
            for symbol in parents
        ],
    }


@router.get("/symbols/{symbol_id}/children")
def get_child_classes(
    symbol_id: int,
    graph_repository: GraphRepository = Depends(
        get_graph_repository
    ),
):

    children = graph_repository.get_child_classes(
        symbol_id
    )

    return {
        "symbol_id": symbol_id,
        "children": [
            dict(symbol)
            for symbol in children
        ],
    }