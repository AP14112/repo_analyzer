from enum import Enum


class RepositoryStatus(str, Enum):
    PENDING = "PENDING"
    CLONING = "CLONING"
    PARSING = "PARSING"
    INDEXING = "INDEXING"
    READY = "READY"
    FAILED = "FAILED"