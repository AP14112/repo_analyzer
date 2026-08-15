from pathlib import Path
from abc import ABC, abstractmethod

from app.modules.files.model import File
from app.modules.parser.schema import ParseResult


class BaseParser(ABC):

    @abstractmethod
    def parse(
        self,
        file: File,
        file_path: Path,
    ) -> ParseResult:
        pass