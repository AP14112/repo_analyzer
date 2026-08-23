# Repository Intelligence — Sprint 7 Frontend

Ready-to-run React/Vite frontend for the current FastAPI OpenAPI contract.

## Backend endpoints integrated

- GET `/repositories/`
- POST `/repositories/analyze`
- DELETE `/repositories/{repository_id}`
- GET `/graph/repositories/{repository_id}`
- GET `/graph/files/{file_id}/symbols`
- GET `/graph/symbols/{symbol_id}/callers`
- GET `/graph/symbols/{symbol_id}/callees`
- GET `/graph/files/{file_id}/dependencies`
- GET `/graph/symbols/{symbol_id}/parents`
- GET `/graph/symbols/{symbol_id}/children`
- POST `/embeddings/generate`
- GET `/embeddings/search`
- POST `/reasoning/ask`

The graph endpoint response is intentionally rendered defensively because the supplied OpenAPI document does not define a concrete response schema for graph endpoints. The same applies to repository-list, search, and embedding-generation responses.

## Run

```bash
npm install
npm run dev
```

Backend default:
`http://127.0.0.1:8000`

To use another backend:

```bash
copy .env.example .env
```

Then set:

```text
VITE_API_BASE_URL=http://your-backend-host:port
```

## Important

The backend must allow the Vite origin through FastAPI CORS. For local development this is normally:

`http://127.0.0.1:5173`

The frontend does not invent endpoint names or request fields. Request contracts are taken from the supplied OpenAPI document.
