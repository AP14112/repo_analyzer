# Repo Analyzer

### AI-Powered Engineering Intelligence for Codebases

Repo Analyzer is a full-stack AI engineering intelligence platform that turns a source-code repository into an explorable knowledge system.

It combines **static code analysis, semantic retrieval, graph relationships, vector embeddings, and LLM reasoning** to help developers understand unfamiliar codebases, trace dependencies, search code semantically, and analyze the impact of changing a symbol.

---

## Features

### Ask Codebase
Ask natural-language questions about an indexed repository. Answers are grounded in retrieved source-code context.

### Semantic Code Search
Natural-language search powered by Sentence Transformers, 384-dimensional embeddings, PostgreSQL + pgvector, cosine-distance retrieval, production-code re-ranking, and deduplication.

Results expose file path, symbol, line range, source code, and similarity distance.

### Architecture Explorer
Interactive repository architecture visualization focused on:

```text
File -> IMPORTS -> Module
```

Includes search, zoom, fit-to-screen, node details, import/imported-by relationships, and isolated-file filtering.

### Call Graph
Search for a symbol such as `wsgi_app` and inspect its callers and callees through an interactive graph.

### Impact Analysis
Explore direct callers, transitive callers, callees, parent/child symbols, inheritance relationships, and related files to understand what could be affected by a change.

### Repository Documentation
A documentation workspace summarizes indexed repository data including detected languages, file counts, class/function statistics, key symbols, and repository structure.

---

## Architecture

```text
                       Repository
                           |
                           v
                  Repository Ingestion
                           |
                           v
                  Static Code Analysis
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
        PostgreSQL       Neo4j       Embeddings
        + pgvector     Graph Data
             |             |             |
             +-------------+-------------+
                           |
                           v
                    Retrieval + Ranking
                           |
                           v
                     Context Builder
                           |
                           v
                      LLM Reasoning
                           |
                           v
                        React UI
```

### PostgreSQL + pgvector
Stores repositories, files, symbols, code chunks, and embeddings.

### Neo4j
Stores repository relationships such as:

```text
File --IMPORTS--> Module
Symbol --CALLS--> Symbol
Symbol --INHERITS--> Symbol
```

### LLM Reasoning

```text
User Query
    |
Semantic Retrieval
    |
Re-ranking
    |
Context Budgeting
    |
Relevant Source Code
    |
LLM
    |
Grounded Answer
```

---

## Retrieval Pipeline

1. **Embedding generation** — source-code chunks are converted into 384-dimensional vectors using `sentence-transformers/all-MiniLM-L6-v2`.
2. **Vector retrieval** — PostgreSQL + pgvector performs cosine-distance similarity search.
3. **Re-ranking** — test-heavy results are penalized for production-code questions.
4. **Deduplication** — repeated file/symbol results are reduced.
5. **Context budgeting** — oversized source chunks are truncated before reaching the LLM.

Current context limits:

```text
Maximum chunk contribution: 80 lines
Global context budget:      20,000 characters
```

An early configuration could produce approximately **22,000+ tokens** of raw context. Context budgeting reduced typical LLM input to approximately **4,000–5,000 tokens**.

---

## Technology Stack

**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, pgvector, Neo4j

**AI / ML:** Hugging Face, Sentence Transformers, `all-MiniLM-L6-v2`, embeddings, LLM reasoning, RAG

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Force Graph, React Syntax Highlighter

**Infrastructure:** Docker, Git, REST APIs

---

## Project Structure

```text
repo_analyzer/
├── backend/
│   └── app/
│       ├── core/
│       └── modules/
│           ├── repository/
│           ├── parser/
│           ├── chunk/
│           ├── embedding/
│           ├── graph/
│           └── reasoning/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
├── docker/
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL with pgvector
- Neo4j
- Git
- Docker (recommended)

### 1. Clone

```bash
git clone https://github.com/AP14112/repo_analyzer.git
cd repo_analyzer
```

### 2. Configure Environment

Create `backend/.env` and configure your database and LLM credentials.

Example:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/repo_analyzer

NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

LLM_API_KEY=your_api_key
```

Never commit real credentials.

### 3. Start Infrastructure

```bash
docker compose up -d
```

### 4. Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API:

```text
http://localhost:8000
```

FastAPI docs:

```text
http://localhost:8000/docs
```

### 5. Start Frontend

From the frontend directory:

```bash
npm install
npm run dev
```

---

## Verification

Frontend type checking:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

Current verification:

```text
TypeScript typecheck: PASS
Vite production build: PASS
```

---

## Repository Ingestion Flow

```text
Git Repository
      |
      v
Clone / File Discovery
      |
      v
Language Detection
      |
      v
AST / Static Analysis
      |
      v
Symbol Extraction
      |
      v
CodeChunk Generation
      |
      +------------------+
      |                  |
      v                  v
 PostgreSQL           Neo4j
      |                  |
      v                  v
 Embeddings         Relationships
      |                  |
      +--------+---------+
               |
               v
        Retrieval Layer
               |
               v
         Context Builder
               |
               v
          LLM Reasoning
```

---

## Example Questions

```text
Where is the main application class defined?
```

```text
How does the request lifecycle work?
```

```text
What calls full_dispatch_request?
```

```text
How are HTTP sessions implemented?
```

```text
What files import the application module?
```

```text
If I change this function, what could be affected?
```

```text
Where are the tests for this functionality?
```

---

## Engineering Challenges

### Embedding Persistence

An early ingestion implementation generated code chunks but did not persist embeddings. This caused semantic search to return no results and left the LLM without repository context.

The pipeline was corrected so embeddings are generated and persisted after code chunks are created.

### Context Explosion

Large classes could produce extremely large retrieval contexts. The context-budgeting layer addresses this through chunk truncation, global character limits, retrieval deduplication, and test-result re-ranking.

### Graph Density

Displaying every symbol in a large repository simultaneously produces an unreadable graph. The UI therefore separates:

```text
Architecture
    -> Files / Modules / Imports

Call Graph
    -> Symbols / Calls

Impact Analysis
    -> Dependency impact
```

---

## Roadmap

### Completed

- [x] Repository ingestion
- [x] Static code analysis
- [x] Symbol extraction
- [x] Code chunk generation
- [x] PostgreSQL persistence
- [x] Neo4j knowledge graph
- [x] Vector embeddings
- [x] Semantic code search
- [x] Retrieval re-ranking
- [x] Context budgeting
- [x] LLM codebase reasoning
- [x] Architecture explorer
- [x] Call graph
- [x] Impact analysis
- [x] Repository documentation workspace
- [x] Interactive React frontend
- [x] Light / dark theme

### Next

- [ ] Multi-language parsing
- [ ] JavaScript / TypeScript support
- [ ] Java support
- [ ] C / C++ support
- [ ] Go support
- [ ] Hierarchical code chunking
- [ ] Background repository ingestion
- [ ] Production deployment
- [ ] Authentication and access control
- [ ] Production observability
- [ ] Performance optimization

---

## Vision

Modern software repositories contain enormous amounts of implicit knowledge.

Repo Analyzer aims to turn information across files, symbols, imports, call chains, tests, documentation, and dependency relationships into a single engineering intelligence layer.

The long-term goal is to make questions like:

> **"What happens if I change this?"**

as easy to answer as:

> **"Where is this defined?"**

---

## Author

**Aryaman Prasad**

B.Tech — Electronics and Communication Engineering  
Birla Institute of Technology Mesra

GitHub: https://github.com/AP14112

---

## License

This project is currently provided for educational and portfolio purposes.
