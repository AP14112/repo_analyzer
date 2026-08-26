export type RepositoryStatus = 'PENDING' | 'CLONING' | 'PARSING' | 'INDEXING' | 'READY' | 'FAILED' | string;

export type Repository = {
  repository_id: number;
  github_url: string;
  local_path: string;
  status: RepositoryStatus;
  created_at?: string;
};

export type AnalyzeRepositoryResponse = {
  repository_id: number;
  github_url: string;
  local_path: string;
  status: RepositoryStatus;
};

export type DeleteRepositoryResponse = {
  message: string;
  repository_id: number;
};

export type AnalyzeRequest = {
  repository_url: string;
};

export type GraphNode = {
  id?: number | null;
  name?: string | null;
  kind?: string | null;
  relative_path?: string | null;
  language?: string | null;
  [key: string]: unknown;
};

export type RepositoryGraph = {
  repository: Record<string, unknown>;
  files: GraphNode[];
};

export type FileSymbolsResponse = {
  file_id: number;
  symbols: GraphNode[];
};

export type SymbolRelationsResponse = {
  symbol_id: number;
  callers?: GraphNode[];
  callees?: GraphNode[];
  parents?: GraphNode[];
  children?: GraphNode[];
};

export type FileDependenciesResponse = {
  file_id: number;
  dependencies: GraphNode[];
};

export type SearchResult = {
  id?: number;
  file_id?: number;
  symbol_id?: number | null;
  content?: string;
  chunk_text?: string;
  relative_path?: string;
  file_path?: string;
  similarity?: number;
  distance?: number;
  score?: number;
  language?: string;
  start_line?: number;
  graph_context?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
};

export type ReasoningResponse = {
  query: string;
  answer: string;
  sources: SearchResult[];
};

export type GenerateEmbeddingsResponse = {
  status: string;
  chunks_embedded: number;
};

export type HealthResponse = {
  status: string;
  message?: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json() as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // The backend may return an empty body for some failures.
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export type RepositoryStats = {
  repository_id: number;
  name: string;
  github_url: string;
  language: string;
  file_count: number;
  function_count: number;
  class_count: number;
  created_at: string;
  status: string;
};

export type SymbolContextResponse = {
  symbol: GraphNode;
  callers: GraphNode[];
  callees: GraphNode[];
  parents: GraphNode[];
  children: GraphNode[];
};

export type GraphEdge = {
  source: number;
  target: number;
  type: string;
  source_name?: string;
  target_name?: string;
};

export type GraphEdgesResponse = {
  edges: GraphEdge[];
};

// We will export a new api object that includes everything
export const api = {
  getRoot: () => request<HealthResponse>('/'),
  getHealth: () => request<HealthResponse>('/health'),
  listRepositories: () => request<Repository[]>('/repositories/'),
  analyzeRepository: (body: AnalyzeRequest) => request<AnalyzeRepositoryResponse>('/repositories/analyze', { method: 'POST', body: JSON.stringify(body) }),
  deleteRepository: (repositoryId: number) => request<DeleteRepositoryResponse>(`/repositories/${repositoryId}`, { method: 'DELETE' }),
  getRepositoryStats: (repositoryId: number) => request<RepositoryStats>(`/repositories/${repositoryId}/stats`),
  getRepositoryGraph: (repositoryId: number) => request<RepositoryGraph>(`/graph/repositories/${repositoryId}`),
  getFileSymbols: (fileId: number) => request<FileSymbolsResponse>(`/graph/files/${fileId}/symbols`),
  getFileDependencies: (fileId: number) => request<FileDependenciesResponse>(`/graph/files/${fileId}/dependencies`),
  getSymbolCallers: (symbolId: number) => request<SymbolRelationsResponse>(`/graph/symbols/${symbolId}/callers`),
  getSymbolCallees: (symbolId: number) => request<SymbolRelationsResponse>(`/graph/symbols/${symbolId}/callees`),
  getSymbolParents: (symbolId: number) => request<SymbolRelationsResponse>(`/graph/symbols/${symbolId}/parents`),
  getSymbolChildren: (symbolId: number) => request<SymbolRelationsResponse>(`/graph/symbols/${symbolId}/children`),
  generateEmbeddings: () => request<GenerateEmbeddingsResponse>('/embeddings/generate', { method: 'POST' }),
  searchCode: (repositoryId: number, query: string, limit = 10) => request<SearchResponse>(`/embeddings/search?repository_id=${repositoryId}&q=${encodeURIComponent(query)}&limit=${limit}`),
  askCodebase: (repositoryId: number, query: string, limit = 5) => request<ReasoningResponse>('/reasoning/ask', { method: 'POST', body: JSON.stringify({ repository_id: repositoryId, query, limit }) }),
  getSymbolContext: (symbolId: number) => request<SymbolContextResponse>(`/graph/symbols/${symbolId}/context`),
  getImpactAnalysis: (symbolId: number) => request<any>(`/graph/symbols/${symbolId}/impact`),
  getRepositoryEdges: (repositoryId: number) => request<GraphEdgesResponse>(`/graph/repositories/${repositoryId}/edges`),
};

export { API_BASE_URL };
