from pathlib import Path

from app.modules.parser.python_parser import PythonParser


class ParserService:
    def __init__(self):
        self.python_parser = PythonParser()

    def parse(self, file_path: Path):
        if file_path.suffix == ".py":
            return self.python_parser.parse(file_path)

        return None