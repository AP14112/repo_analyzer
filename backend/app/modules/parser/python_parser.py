from pathlib import Path

from tree_sitter_language_pack import get_parser

from app.modules.files.model import File
from app.modules.parser.interfaces import BaseParser
from app.modules.parser.schema import ParseResult
from app.modules.relationship.model import Relationship
from app.modules.symbol.model import Symbol


class PythonParser(BaseParser):

    def __init__(self):
        self.parser = get_parser("python")

    def parse(
        self,
        file: File,
        file_path: Path,
    ) -> ParseResult:

        source = file_path.read_bytes()
        tree = self.parser.parse(source)

        symbols: list[Symbol] = []
        relationships: list[Relationship] = []

        self._walk(
            tree.root_node,
            file,
            symbols,
            relationships,
            current_class=None,
            current_function=None,
        )

        return ParseResult(
            symbols=symbols,
            relationships=relationships,
        )

    def _walk(
        self,
        node,
        file: File,
        symbols: list[Symbol],
        relationships: list[Relationship],
        current_class: str | None,
        current_function: str | None,
    ) -> None:

        symbol = self._extract_symbol(
            node,
            file,
        )

        previous_class = current_class
        previous_function = current_function

        if symbol is not None:

            symbols.append(symbol)

            if symbol.kind == "class":

                current_class = symbol.name
                current_function = None

            elif symbol.kind == "function":

                current_function = symbol.name

                if current_class is not None:

                    relationships.append(
                        Relationship(
                            file_id=file.id,
                            source_symbol=current_class,
                            target_symbol=symbol.name,
                            relationship_type="CONTAINS",
                        )
                    )

        if node.type == "call" and current_function is not None:

            function_node = node.child_by_field_name(
                "function"
            )

            if function_node is not None:

                called_name = self._get_called_name(
                    function_node
                )

                if called_name is not None:

                    relationships.append(
                        Relationship(
                            file_id=file.id,
                            source_symbol=current_function,
                            target_symbol=called_name,
                            relationship_type="CALLS",
                        )
                    )

        for child in node.children:

            self._walk(
                child,
                file,
                symbols,
                relationships,
                current_class,
                current_function,
            )

        current_class = previous_class
        current_function = previous_function

    def _get_called_name(
        self,
        node,
    ) -> str | None:

        if node.type == "identifier":

            return node.text.decode()

        if node.type == "attribute":

            attribute_node = node.child_by_field_name(
                "attribute"
            )

            if attribute_node is not None:

                return attribute_node.text.decode()

        return None

    def _extract_symbol(
        self,
        node,
        file: File,
    ) -> Symbol | None:

        if node.type == "class_definition":

            name_node = node.child_by_field_name(
                "name"
            )

            if name_node is None:
                return None

            return Symbol(
                file_id=file.id,
                name=name_node.text.decode(),
                kind="class",
                start_line=node.start_point[0] + 1,
                end_line=node.end_point[0] + 1,
            )

        if node.type == "function_definition":

            name_node = node.child_by_field_name(
                "name"
            )

            if name_node is None:
                return None

            return Symbol(
                file_id=file.id,
                name=name_node.text.decode(),
                kind="function",
                start_line=node.start_point[0] + 1,
                end_line=node.end_point[0] + 1,
            )

        return None