# UI Implementation Plan

## Phase 1 - Audit
Existing functionality is mostly wired up but visually cluttered or incorrectly categorized. 
- The Sidebar mixes Global and Repo routes.
- The Call Graph, Architecture, and Impact Analysis are wired to basic endpoints but lack polish, and all dump raw nodes rather than well-curated specific subsets.
- Code Search and Ask Codebase use the real APIs.

## Phase 2 - Information Architecture
Update `Sidebar.tsx`:
Separate global navigation (Overview, Repositories, Settings) from Repository navigation.
When a repository is selected, show its specific nav items (Architecture, Call Graph, Impact Analysis, Code Search, Ask Codebase, Documentation) under a "REPOSITORY WORKSPACE" section.

## Phase 3 - Architecture Graph
Modify `Architecture.tsx`.
- Should show: Repository -> Files -> Modules/Import dependencies.
- Fix: `api.getRepositoryGraph` or `api.getRepositoryEdges`. Use `ForceGraph2D`.
- Filter out detailed symbols. Only show files/directories/modules. Use `readable names` like `src/flask/app.py`.

## Phase 4 - Call Graph
Modify `CallGraph.tsx`.
- It already searches for a symbol and gets `api.getSymbolContext`.
- Ensure nodes have `symbol.name` instead of DB IDs.
- Ensure only Callers and Callees are shown.

## Phase 5 - Impact Analysis
Modify `ImpactAnalysis.tsx`.
- Should show callers, transitive callers, callees, parents/children.
- Similar search functionality to Call Graph, but broader context.
- Empty states with explanations.

## Phase 6 - Code Search
Modify `Search.tsx`.
- Show file path, symbol name, line range, distance, source preview.
- Handle loading/empty/error states.
- Click to open code preview.

## Phase 7 - Ask Codebase
Modify `Ask.tsx`.
- Make sure Sources show file, symbol, line range.
- Empty states for no context.
- No fake sources, no graph if context missing.

## Phase 8 - Documentation
Modify `Documentation.tsx`.
- DO NOT render a graph here.
- Fetch stats, files, overview.
- Clean UI listing languages, structure, modules.

## Phase 9 & 11 & 12 - UI Quality, Theme, States
- Fix light/dark theme toggle in `Header.tsx` or `Settings.tsx`.
- Handle loading/empty/error states across all pages.
