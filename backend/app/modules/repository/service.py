from pathlib import Path
from urllib.parse import urlparse
from app.core.neo4j import Neo4jConnection
from app.modules.graph.service import Neo4jGraphService
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.files.dao import FileDAO
from app.modules.files.model import File
from app.modules.git.service import GitService
from app.modules.parser.factory import ParserFactory
from app.modules.parser.relationship_extractor import (
    RelationshipExtractor,
)
from app.modules.relationship.model import Relationship
from app.modules.relationship.repository import RelationshipDAO
from app.modules.repository.enums import RepositoryStatus
from app.modules.repository.model import Repository
from app.modules.repository.repository import RepositoryDAO
from app.modules.repository.schema import (
    RepositoryAnalyzeRequest,
    RepositoryAnalyzeResponse,
)
from app.modules.scanner.service import RepositoryScanner
from app.modules.symbol.model import Symbol
from app.modules.symbol.repository import SymbolDAO


class RepositoryService:

    STORAGE_ROOT = Path(
        "storage/repositories"
    )

    def __init__(self, db: Session):
        self.db = db
        self.repository_dao = RepositoryDAO(db)
        self.file_dao = FileDAO(db)
        self.symbol_dao = SymbolDAO(db)
        self.relationship_dao = RelationshipDAO(db)

        self.git_service = GitService()
        self.repository_scanner = RepositoryScanner()

        self.neo4j = Neo4jConnection()
        self.graph_service = Neo4jGraphService(
            self.neo4j.driver
        )

    # ======================================================
    # SUBMIT REPOSITORY
    # ======================================================

    def submit_repository(
        self,
        request: RepositoryAnalyzeRequest,
    ) -> RepositoryAnalyzeResponse:

        github_url = str(
            request.repository_url
        )

        self._validate_repository(
            github_url
        )

        # --------------------------------------------------
        # Find existing repository
        # --------------------------------------------------

        repository = (
            self._check_existing_repository(
                github_url
            )
        )

        # --------------------------------------------------
        # Existing repository
        # --------------------------------------------------

        if repository is not None:

            print(
                f"Existing repository found: "
                f"{repository.id}"
            )

            print(
                f"Current status: "
                f"{repository.status.value}"
            )

            # ----------------------------------------------
            # FAILED / PENDING
            # ----------------------------------------------

            if repository.status in {
                RepositoryStatus.FAILED,
                RepositoryStatus.PENDING,
            }:

                print(
                    "Repository is FAILED/PENDING."
                )

                print(
                    "Preparing repository for retry."
                )

                self._prepare_for_retry(
                    repository
                )

            # ----------------------------------------------
            # READY
            # ----------------------------------------------

            elif (
                repository.status
                == RepositoryStatus.READY
            ):

                remote_commit = (
                    self.git_service.get_remote_commit(
                        github_url
                    )
                )

                print(
                    f"Stored commit: "
                    f"{repository.commit_hash}"
                )

                print(
                    f"Remote commit: "
                    f"{remote_commit}"
                )

                # ------------------------------------------
                # Same commit
                # ------------------------------------------

                if (
                    repository.commit_hash
                    == remote_commit
                ):

                    print(
                        "Repository has not changed."
                    )

                    print(
                        "Returning existing analysis."
                    )

                    return (
                        RepositoryAnalyzeResponse(
                            repository_id=repository.id,
                            github_url=repository.github_url,
                            local_path=repository.local_path,
                            status=repository.status.value,
                        )
                    )

                # ------------------------------------------
                # Different commit
                # ------------------------------------------

                print(
                    "Repository has changed."
                )

                print(
                    "Re-analysis required."
                )

                self._clear_analysis_data(
                    repository.id
                )

                repository.commit_hash = None

        # --------------------------------------------------
        # New repository
        # --------------------------------------------------

        else:

            repository = self._create_repository(
                github_url=github_url,
                local_path="",
            )

        # --------------------------------------------------
        # Repository path
        # --------------------------------------------------

        repository_path = (
            self.STORAGE_ROOT
            / str(repository.id)
        )

        repository.local_path = str(
            repository_path
        )

        repository.status = (
            RepositoryStatus.PENDING
        )

        repository = (
            self.repository_dao.update(
                repository
            )
        )

        # ==================================================
        # ANALYSIS
        # ==================================================

        try:

            # ----------------------------------------------
            # Remote commit
            # ----------------------------------------------

            remote_commit = (
                self.git_service.get_remote_commit(
                    github_url
                )
            )

            print(
                f"Commit being analyzed: "
                f"{remote_commit}"
            )

            # ----------------------------------------------
            # 1. Clone
            # ----------------------------------------------

            print(
                "1. Starting clone"
            )

            self._clone_repository(
                github_url=github_url,
                destination=repository_path,
            )

            print(
                "2. Clone complete"
            )

            # ----------------------------------------------
            # 2. Scan
            # ----------------------------------------------

            print(
                "3. Starting scan"
            )

            files = (
                self.repository_scanner.scan(
                    repository
                )
            )

            print(
                f"4. Scan complete: "
                f"{len(files)} files"
            )

            # ----------------------------------------------
            # 3. Persist files
            # ----------------------------------------------

            self.file_dao.create_many(
                files
            )

            print(
                "5. Files persisted"
            )

            # ----------------------------------------------
            # 4. Parse
            # ----------------------------------------------

            all_symbols: list[
                Symbol
            ] = []

            all_relationships: list[
                Relationship
            ] = []

            extractor = (
                RelationshipExtractor()
            )

            for file in files:

                print(
                    f"Processing: "
                    f"{file.relative_path}"
                )

                parser = (
                    ParserFactory.get_parser(
                        file.language
                    )
                )

                if parser is None:

                    print(
                        "  -> No parser"
                    )

                    continue

                file_path = (
                    Path(
                        repository.local_path
                    )
                    / file.relative_path
                )

                # ------------------------------------------
                # Parse symbols
                # ------------------------------------------

                result = parser.parse(
                    file=file,
                    file_path=file_path,
                )

                print(
                    f"  -> Symbols extracted: "
                    f"{len(result.symbols)}"
                )

                # ------------------------------------------
                # Extract relationships
                # ------------------------------------------

                relationships = (
                    extractor.extract(
                        file=file,
                        file_path=file_path,
                    )
                )

                print(
                    f"  -> Relationships extracted: "
                    f"{len(result.relationships) + len(relationships)}"
                )

                all_symbols.extend(
                    result.symbols
                )

                all_relationships.extend(
                    result.relationships
                )

                all_relationships.extend(
                    relationships
                )

            # ----------------------------------------------
            # 5. Symbols
            # ----------------------------------------------

            print(
                f"6. Total symbols: "
                f"{len(all_symbols)}"
            )

            self.symbol_dao.bulk_create(
                all_symbols
            )

            print(
                "7. Symbols inserted"
            )

            # ----------------------------------------------
            # 6. Relationships
            # ----------------------------------------------

            print(
                f"8. Total relationships: "
                f"{len(all_relationships)}"
            )

            self.relationship_dao.bulk_create(
                all_relationships
            )

            print(
                "9. Relationships inserted"
            )
            print(
            "9.5. Starting Neo4j graph synchronization"
            )

            self.graph_service.sync_repository_graph(
                repository_id=repository.id,
                github_url=repository.github_url,
                files=files,
                symbols=all_symbols,
                relationships=all_relationships,
            )

            print(
                "9.6. Neo4j graph synchronization complete"
            )

            # ----------------------------------------------
            # 7. Commit + READY
            # ----------------------------------------------

            repository.commit_hash = (
                remote_commit
            )

            repository.status = (
                RepositoryStatus.READY
            )

            self.repository_dao.update(
                repository
            )

            print(
                "10. Repository marked READY"
            )

            print(
                f"Analyzed commit: "
                f"{remote_commit}"
            )

        except Exception as e:

            import traceback

            traceback.print_exc()

            print(
                "=" * 80
            )

            print(
                "EXCEPTION OCCURRED"
            )

            print(
                type(e).__name__
            )

            print(
                e
            )

            print(
                "=" * 80
            )

            self._update_status(
                repository,
                RepositoryStatus.FAILED,
            )

            raise

        return RepositoryAnalyzeResponse(
            repository_id=repository.id,
            github_url=repository.github_url,
            local_path=repository.local_path,
            status=repository.status.value,
        )

    # ======================================================
    # CLEAN ANALYSIS DATA
    # ======================================================

    def _clear_analysis_data(
        self,
        repository_id: int,
    ) -> None:

        print(
            f"Clearing analysis for repository "
            f"{repository_id}"
        )

        files = (
            self.db.query(File.id)
            .filter(
                File.repository_id
                == repository_id
            )
            .all()
        )

        file_ids = [
            file_id
            for (file_id,) in files
        ]

        if file_ids:

            self.db.query(
                Relationship
            ).filter(
                Relationship.file_id.in_(
                    file_ids
                )
            ).delete(
                synchronize_session=False
            )

            self.db.query(
                Symbol
            ).filter(
                Symbol.file_id.in_(
                    file_ids
                )
            ).delete(
                synchronize_session=False
            )

        self.db.query(
            File
        ).filter(
            File.repository_id
            == repository_id
        ).delete(
            synchronize_session=False
        )

        self.db.commit()

        print(
            "Old analysis cleared."
        )

    # ======================================================
    # RETRY FAILED/PENDING
    # ======================================================

    def _prepare_for_retry(
        self,
        repository: Repository,
    ) -> None:

        repository_path = (
            self.STORAGE_ROOT
            / str(repository.id)
        )

        if repository_path.exists():

            print(
                f"Removing failed repository: "
                f"{repository_path}"
            )

            self.git_service._remove_directory(
                repository_path
            )

        self._clear_analysis_data(
            repository.id
        )

        repository.status = (
            RepositoryStatus.PENDING
        )

        repository.commit_hash = None

        self.repository_dao.update(
            repository
        )

    # ======================================================
    # VALIDATE
    # ======================================================

    def _validate_repository(
        self,
        github_url: str,
    ) -> None:

        parsed = urlparse(
            github_url
        )

        if (
            parsed.scheme
            not in {"http", "https"}
            or parsed.netloc
            != "github.com"
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid GitHub "
                    "repository URL."
                ),
            )

    # ======================================================
    # DAO
    # ======================================================

    def _check_existing_repository(
        self,
        github_url: str,
    ) -> Repository | None:

        return (
            self.repository_dao
            .get_by_github_url(
                github_url
            )
        )

    def _create_repository(
        self,
        github_url: str,
        local_path: str,
    ) -> Repository:

        repository = Repository(
            github_url=github_url,
            local_path=local_path,
            status=RepositoryStatus.PENDING,
        )

        return self.repository_dao.create(
            repository
        )

    # ======================================================
    # CLONE
    # ======================================================

    def _clone_repository(
        self,
        github_url: str,
        destination: Path,
    ) -> None:

        destination.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.git_service.clone_repository(
            github_url=github_url,
            destination=destination,
        )

    # ======================================================
    # STATUS
    # ======================================================

    def _update_status(
        self,
        repository: Repository,
        status: RepositoryStatus,
    ) -> None:

        repository.status = status

        self.repository_dao.update(
            repository
        )