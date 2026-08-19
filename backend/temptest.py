from pathlib import Path

from app.core.database import SessionLocal

from app.modules.files.model import File
from app.modules.symbol.model import Symbol
from app.modules.relationship.model import Relationship
from app.modules.chunk.model import CodeChunk
from app.modules.chunk.repository import CodeChunkRepository
from app.modules.chunk.extractor import CodeChunkExtractor

REPOSITORY_ID = 11

db = SessionLocal()
chunk_repository = CodeChunkRepository(db)
try:

    files = (
        db.query(File)
        .filter(
            File.repository_id == REPOSITORY_ID
        )
        .all()
    )

    extractor = CodeChunkExtractor()

    total_chunks = 0

    for file in files:

        if file.language != "Python":
            continue

        symbols = (
            db.query(Symbol)
            .filter(
                Symbol.file_id == file.id
            )
            .all()
        )

        if not symbols:
            continue

        file_path = (
            Path("storage")
            / "repositories"
            / str(REPOSITORY_ID)
            / file.relative_path
        )

        if not file_path.exists():
            print(
                f"SKIPPING: {file.relative_path}"
            )
            continue

        chunks = extractor.extract(
            file=file,
            symbols=symbols,
            file_path=file_path,
        )

        print(
            f"{file.relative_path}: "
            f"{len(chunks)} chunks"
        )

        for chunk in chunks[:3]:
            print("-" * 60)
            print(
                f"Symbol: {chunk.symbol_name}"
            )
            print(
                f"Type: {chunk.chunk_type}"
            )
            print(
                f"Lines: "
                f"{chunk.start_line}-"
                f"{chunk.end_line}"
            )
            print(chunk.content[:500])
        chunk_repository.bulk_create(chunks)
        total_chunks += len(chunks)

    print("=" * 60)
    print(
        f"TOTAL GENERATED CHUNKS: "
        f"{total_chunks}"
    )

finally:
    db.close()