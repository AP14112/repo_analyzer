from dataclasses import dataclass

from app.modules.relationship.model import Relationship
from app.modules.symbol.model import Symbol


@dataclass
class ParseResult:
    symbols: list[Symbol]
    relationships: list[Relationship]