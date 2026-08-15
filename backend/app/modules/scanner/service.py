
from logging import root
from pathlib import Path

from app.modules.files.model import File
IGNORED_DIRECTORIES = {
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "node_modules",
    ".idea",
    ".vscode",
    "dist",
    "build",
}

LANGUAGE_MAP = {
    ".py": "Python",
    ".cpp": "C++",
    ".c": "C",
    ".java": "Java",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".go": "Go",
    ".rs": "Rust",
    ".md": "Markdown",
    ".json": "JSON",
    ".yml": "YAML",
    ".yaml": "YAML",
}

class RepositoryScanner:

    def scan(self, repository)-> list[File]:
        root = Path(repository.local_path)
        if not root.exists():
            raise FileNotFoundError(
                f"Repository path '{root}' does not exist."
            )
        files: list[File] = []
        for path in root.rglob("*"):
            if path.is_dir():
                continue
            if any(part in IGNORED_DIRECTORIES for part in path.parts):
                continue
            relative_path = str(path.relative_to(root))
            extension = path.suffix.lower()
            language = LANGUAGE_MAP.get(extension, "Unknown")
            size = path.stat().st_size
            file = File(
            repository_id=repository.id,
            relative_path=relative_path,
            extension=extension,
            language=language,
            size=size,
            )
            files.append(file)
        return files