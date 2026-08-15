

class RepositoryError(Exception):
    """Base exception for repository-related operations."""



class RepositoryCloneError(RepositoryError):
    """Raised when a repository cannot be cloned."""