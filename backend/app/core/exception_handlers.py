from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.logger import logger
from app.exceptions.repository import RepositoryCloneError


def register_exception_handlers(app: FastAPI):

    @app.exception_handler(RepositoryCloneError)
    async def repository_clone_exception_handler(
        request: Request,
        exc: RepositoryCloneError,
    ):

        logger.exception(exc)

        return JSONResponse(
            status_code=400,
            content={
                "status": "failed",
                "message": str(exc),
            },
        )