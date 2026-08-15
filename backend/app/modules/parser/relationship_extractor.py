from pathlib import Path

from tree_sitter_language_pack import get_parser

from app.modules.files.model import File
from app.modules.relationship.model import Relationship


class RelationshipExtractor:

    def __init__(self):
        self.parser = get_parser("python")

    def extract(
        self,
        file: File,
        file_path: Path,
    ) -> list[Relationship]:

        source = file_path.read_bytes()
        tree = self.parser.parse(source)

        relationships: list[Relationship] = []

        self._walk(
            tree.root_node,
            file,
            relationships,
        )

        return relationships

    def _walk(
        self,
        node,
        file: File,
        relationships: list[Relationship],
    ) -> None:

        # Extract import relationships
        relationships.extend(
            self._extract_import(
                node,
                file,
            )
        )

        # Extract inheritance relationships
        relationships.extend(
            self._extract_inheritance(
                node,
                file,
            )
        )

        # Debug: print class AST structure
        if node.type == "class_definition":
            print("=" * 60)
            print("CLASS DEFINITION")

            for child in node.children:
                print(
                    child.type,
                    child.text.decode(errors="ignore"),
                )

        # Continue DFS traversal
        for child in node.children:
            self._walk(
                child,
                file,
                relationships,
            )

    def _extract_import(
        self,
        node,
        file: File,
    ) -> list[Relationship]:

        relationships: list[Relationship] = []

        if node.type == "import_statement":

            for child in node.children:

                if child.type == "dotted_name":

                    relationships.append(
                        Relationship(
                            file_id=file.id,
                            source_symbol="<module>",
                            target_symbol=child.text.decode(),
                            relationship_type="IMPORTS",
                        )
                    )

        elif node.type == "import_from_statement":

            module_name = None

            for child in node.children:

                if child.type == "dotted_name":
                    module_name = child.text.decode()
                    break

            if module_name:

                relationships.append(
                    Relationship(
                        file_id=file.id,
                        source_symbol="<module>",
                        target_symbol=module_name,
                        relationship_type="IMPORTS",
                    )
                )

        return relationships

    def _extract_inheritance(
        self,
        node,
        file: File,
    ) -> list[Relationship]:

        relationships: list[Relationship] = []

        if node.type != "class_definition":
            return relationships

        class_name = None

        for child in node.children:
            if child.type == "identifier":
                class_name = child.text.decode()
                break

        if class_name is None:
            return relationships

        for child in node.children:

            if child.type == "argument_list":

                for base in child.children:

                    if base.type == "identifier":

                        relationships.append(
                            Relationship(
                                file_id=file.id,
                                source_symbol=class_name,
                                target_symbol=base.text.decode(),
                                relationship_type="INHERITS",
                            )
                        )

                    elif base.type == "dotted_name":

                        relationships.append(
                            Relationship(
                                file_id=file.id,
                                source_symbol=class_name,
                                target_symbol=base.text.decode(),
                                relationship_type="INHERITS",
                            )
                        )

        return relationships