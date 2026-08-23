class ContextBuilder:

    def build(
        self,
        search_results: list[dict],
    ) -> str:

        sections = []

        for result in search_results:

            graph = result.get("graph_context", {})
            symbol = graph.get("symbol", {})

            callers = graph.get("callers", [])
            callees = graph.get("callees", [])
            parents = graph.get("parents", [])
            children = graph.get("children", [])

            section = f"""
FILE: {result.get("file_path", "Unknown")}
LANGUAGE: {result.get("language", "Unknown")}

SYMBOL:
- Name: {result.get("symbol_name") or symbol.get("name", "Unknown")}
- Type: {result.get("chunk_type") or symbol.get("kind", "Unknown")}
- Lines: {result.get("start_line")} - {result.get("end_line")}

CODE:
{result.get("content", "")}

GRAPH CONTEXT:
- Callers: {self._format_nodes(callers)}
- Callees: {self._format_nodes(callees)}
- Parent classes: {self._format_nodes(parents)}
- Child classes: {self._format_nodes(children)}
"""

            sections.append(section.strip())

        return "\n\n---\n\n".join(sections)

    @staticmethod
    def _format_nodes(nodes: list) -> str:

        if not nodes:
            return "None found"

        names = []

        for node in nodes:
            if isinstance(node, dict):
                names.append(
                    node.get("name", "Unknown")
                )
            else:
                names.append(
                    getattr(node, "get", lambda _: "Unknown")("name")
                )

        return ", ".join(names)