class ContextBuilder:

    def build(
        self,
        search_results: list[dict],
    ) -> str:

        sections = []
        current_len = 0
        MAX_CHARS = 20000

        for result in search_results:

            graph = result.get("graph_context") or {}
            symbol = graph.get("symbol") or {}

            callers = graph.get("callers", [])
            callees = graph.get("callees", [])
            parents = graph.get("parents", [])
            children = graph.get("children", [])

            # Enforce line limits on chunk content
            content = result.get("content", "")
            lines = content.splitlines()
            if len(lines) > 80:
                content = "\n".join(lines[:80]) + f"\n... [Truncated {len(lines) - 80} more lines]"

            section = f"""
FILE: {result.get("file_path", "Unknown")}
LANGUAGE: {result.get("language", "Unknown")}

SYMBOL:
- Name: {result.get("symbol_name") or symbol.get("name", "Unknown")}
- Type: {result.get("chunk_type") or symbol.get("kind", "Unknown")}
- Lines: {result.get("start_line")} - {result.get("end_line")}

CODE:
{content}

GRAPH CONTEXT:
- Callers: {self._format_nodes(callers)}
- Callees: {self._format_nodes(callees)}
- Parent classes: {self._format_nodes(parents)}
- Child classes: {self._format_nodes(children)}
"""
            section = section.strip()
            
            if current_len + len(section) > MAX_CHARS:
                break
                
            sections.append(section)
            current_len += len(section)

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