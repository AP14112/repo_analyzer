from sqlalchemy.orm import Session

from app.modules.symbol.model import Symbol


class SymbolDAO:

    def __init__(self, db: Session):
        self.db = db

    def bulk_create(
        self,
        symbols: list[Symbol],
    ) -> None:

        self.db.add_all(symbols)
        self.db.commit()

    def get_by_repository(
        self,
        repository_id: int,
    ) -> list[Symbol]:

        return (
            self.db.query(Symbol)
            .join(Symbol.file)
            .filter(
                Symbol.file.has(
                    repository_id=repository_id
                )
            )
            .all()
        )