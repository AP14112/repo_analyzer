from pathlib import Path

from app.modules.files.model import File
from app.modules.symbol.model import Symbol
from app.modules.chunk.model import CodeChunk


class CodeChunkExtractor:

    def extract(
        self,
        file: File,
        symbols: list[Symbol],
        file_path: Path,
    ) -> list[CodeChunk]:

        source = file_path.read_text(
            encoding="utf-8",
            errors="ignore",
        )

        lines = source.splitlines()

        chunks: list[CodeChunk] = []

        for symbol in symbols:

            start = max(symbol.start_line - 1, 0)
            end = min(symbol.end_line, len(lines))

            content = "\n".join(
                lines[start:end]
            )

            if not content.strip():
                continue

            chunks.append(
                CodeChunk(
                    file_id=file.id,
                    symbol_id=symbol.id,
                    symbol_name=symbol.name,
                    chunk_type=symbol.kind,
                    content=content,
                    start_line=symbol.start_line,
                    end_line=symbol.end_line,
                )
            )

        return chunks