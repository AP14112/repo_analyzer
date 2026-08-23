import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowLeft, ArrowRight, Bot, Box, Check,
  ChevronDown, ChevronRight, CircleDot, Code2, Copy, Database,
  FileCode2, GitBranch, GitCommitHorizontal, GitFork, Github,
  Layers3, LayoutDashboard, Loader2, Network, Plus, RefreshCw,
  Search, Settings, Sparkles, Trash2, UploadCloud, X, Zap
} from "lucide-react";
import "./index.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    const message =
      data?.detail?.map?.((x) => x.msg).join(", ") ||
      data?.detail ||
      data?.message ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function repoId(repo) {
  return repo?.repository_id ?? repo?.id ?? repo?.repositoryId;
}

function repoName(repo) {
  const url = repo?.github_url || repo?.repository_url || repo?.url || "";
  return repo?.name || repo?.repo_name || (url ? url.replace(/\/$/, "").split("/").pop() : `Repository ${repoId(repo)}`);
}

function statusClass(status = "") {
  const s = String(status).toUpperCase();
  if (s === "READY") return "status ready";
  if (s === "FAILED") return "status failed";
  if (s === "PENDING") return "status pending";
  return "status working";
}

function prettyStatus(status = "") {
  return String(status || "UNKNOWN").replaceAll("_", " ");
}

function extractSources(data) {
  return arr(data?.sources ?? data?.results ?? data?.documents);
}

function sourcePath(source) {
  return source?.file_path || source?.path || source?.file || source?.filename || source?.metadata?.file_path || source?.metadata?.path || "Unknown file";
}

function sourceScore(source) {
  const value = source?.score ?? source?.similarity ?? source?.distance ?? source?.metadata?.score;
  return typeof value === "number" ? value.toFixed(2) : "";
}

function sourceCode(source) {
  return source?.code || source?.content || source?.text || source?.chunk || source?.metadata?.code || "";
}

function sourceLines(source) {
  const start = source?.start_line ?? source?.line_start ?? source?.metadata?.start_line;
  const end = source?.end_line ?? source?.line_end ?? source?.metadata?.end_line;
  if (start != null && end != null) return `Lines ${start}-${end}`;
  if (start != null) return `Line ${start}`;
  return "";
}

function IconButton({ title, onClick, children, disabled }) {
  return <button className="icon-btn" title={title} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Sidebar({ page, setPage, repositories, selectedId, setSelectedId, onAdd }) {
  const items = [
    ["overview", "Overview", LayoutDashboard],
    ["ask", "Ask Codebase", Bot],
    ["repositories", "Repositories", Database],
    ["architecture", "Architecture", Network],
    ["search", "Code Search", Search],
    ["settings", "Settings", Settings],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Sparkles size={19}/></div>
        <div>
          <div className="brand-name">Repo Intelligence</div>
          <div className="brand-sub">Engineering intelligence</div>
        </div>
      </div>

      <div className="nav-label">NAVIGATION</div>
      <nav className="nav">
        {items.map(([key, label, Icon]) => (
          <button key={key} className={`nav-item ${page === key ? "active" : ""}`} onClick={() => setPage(key)}>
            <Icon size={17}/><span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="repo-section">
        <div className="repo-section-head">
          <span>YOUR REPOSITORIES</span>
          <button className="add-mini" onClick={onAdd}><Plus size={15}/></button>
        </div>
        <div className="repo-list">
          {repositories.length === 0 ? (
            <div className="repo-empty">No repositories yet.</div>
          ) : repositories.map((repo) => {
            const id = repoId(repo);
            return (
              <button
                key={id}
                className={`repo-item ${String(id) === String(selectedId) ? "selected" : ""}`}
                onClick={() => { setSelectedId(id); setPage("ask"); }}
              >
                <span className={`repo-dot ${String(repo?.status).toUpperCase() === "READY" ? "green" : ""}`} />
                <span className="repo-item-text">
                  <strong>{repoName(repo)}</strong>
                  <small>{prettyStatus(repo?.status || "READY")}</small>
                </span>
                {String(id) === String(selectedId) && <Check size={14}/>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-bottom">
        <div className="health-pill"><span className="pulse-dot"/> API connected</div>
        <div className="sidebar-version">v0.1.0</div>
      </div>
    </aside>
  );
}

function Topbar({ selectedRepo, onRefresh, loading, onAdd }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <div className="eyebrow">REPOSITORY INTELLIGENCE</div>
        <h1>{selectedRepo ? repoName(selectedRepo) : "Engineering Intelligence Platform"}</h1>
      </div>
      <div className="topbar-actions">
        <button className="top-action" onClick={onRefresh} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""}/> Refresh</button>
        <button className="top-action" onClick={onAdd}><Plus size={16}/> Add repository</button>
        <div className="avatar">AI</div>
      </div>
    </header>
  );
}

function EmptyState({ icon: Icon = Sparkles, title, text, action, actionText }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={27}/></div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <button className="primary-btn" onClick={action}>{actionText}</button>}
    </div>
  );
}

function Loading({ text = "Loading..." }) {
  return <div className="loading"><Loader2 className="spin" size={20}/><span>{text}</span></div>;
}

function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="error-box">
      <AlertCircle size={18}/>
      <div><strong>Something went wrong</strong><p>{error}</p></div>
      {onRetry && <button className="secondary-btn small" onClick={onRetry}>Retry</button>}
    </div>
  );
}

function AddRepositoryModal({ onClose, onAdded }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/repositories/analyze", {
        method: "POST",
        body: JSON.stringify({ repository_url: url.trim() }),
      });
      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div><h2>Add repository</h2><p>Clone and analyze a GitHub repository.</p></div>
          <IconButton title="Close" onClick={onClose}><X size={19}/></IconButton>
        </div>
        <form onSubmit={submit}>
          <label>GitHub repository URL</label>
          <div className="input-with-icon"><Github size={18}/><input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repository" /></div>
          <div className="modal-hint"><UploadCloud size={15}/> The backend will clone, parse, index, and prepare the repository.</div>
          <ErrorBox error={error}/>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={!url.trim() || loading}>
              {loading ? <><Loader2 size={16} className="spin"/> Analyzing...</> : <><Zap size={16}/> Analyze repository</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RepositoryCard({ repo, onSelect, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const id = repoId(repo);

  async function remove() {
    if (!window.confirm(`Delete ${repoName(repo)}? This cannot be undone.`)) return;
    setDeleting(true);
    try { await onDelete(id); } finally { setDeleting(false); }
  }

  return (
    <div className="repo-card">
      <div className="repo-card-icon"><Github size={22}/></div>
      <div className="repo-card-main">
        <div className="repo-card-title"><h3>{repoName(repo)}</h3><Badge tone={String(repo?.status).toUpperCase() === "READY" ? "green" : ""}>{prettyStatus(repo?.status || "READY")}</Badge></div>
        <p>{repo?.github_url || repo?.repository_url || repo?.url || "GitHub repository"}</p>
        <div className="repo-meta-row">
          <span><GitCommitHorizontal size={14}/> {repo?.commit_hash || "Indexed repository"}</span>
          {repo?.created_at && <span><Activity size={14}/> {new Date(repo.created_at).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className="repo-card-actions">
        <button className="secondary-btn" onClick={() => onSelect(repo)}>Open</button>
        <IconButton title="Delete repository" onClick={remove} disabled={deleting}>{deleting ? <Loader2 className="spin" size={17}/> : <Trash2 size={17}/>}</IconButton>
      </div>
    </div>
  );
}

function RepositoriesPage({ repositories, refresh, setSelectedId, setPage, onAdd }) {
  return (
    <PageShell title="Repositories" subtitle="Manage the codebases connected to your engineering intelligence workspace." actions={<><button className="secondary-btn" onClick={refresh}><RefreshCw size={16}/> Refresh</button><button className="primary-btn" onClick={onAdd}><Plus size={16}/> Add repository</button></>}>
      <div className="stat-grid">
        <div className="stat-card"><span>Total repositories</span><strong>{repositories.length}</strong><Database size={20}/></div>
        <div className="stat-card"><span>Ready</span><strong>{repositories.filter(r => String(r?.status).toUpperCase() === "READY").length}</strong><Check size={20}/></div>
        <div className="stat-card"><span>Processing</span><strong>{repositories.filter(r => !["READY","FAILED"].includes(String(r?.status).toUpperCase())).length}</strong><Activity size={20}/></div>
      </div>
      <section className="panel">
        <div className="panel-head"><div><h2>Connected repositories</h2><p>Open a repository to explore it, search it, or ask questions.</p></div></div>
        <div className="repo-cards">
          {repositories.length ? repositories.map(r => <RepositoryCard key={repoId(r)} repo={r} onSelect={(repo) => { setSelectedId(repoId(repo)); setPage("ask"); }} onDelete={async id => { await api(`/repositories/${id}`, {method:"DELETE"}); await refresh(); }}/>) :
            <EmptyState icon={Github} title="No repositories connected" text="Add a GitHub repository to start building an engineering intelligence view of its codebase." action={onAdd} actionText="Add repository"/>}
        </div>
      </section>
    </PageShell>
  );
}

function AskPage({ selectedRepo, onAdd }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const sources = useMemo(() => extractSources(result), [result]);

  async function ask(question = query) {
    if (!selectedRepo || !question.trim()) return;
    setQuery(question);
    setError("");
    setLoading(true);
    try {
      const data = await api("/reasoning/ask", {
        method: "POST",
        body: JSON.stringify({ query: question.trim(), repository_id: Number(repoId(selectedRepo)), limit: Number(limit) }),
      });
      setResult(data);
      const nextSources = extractSources(data);
      setSelectedSource(nextSources[0] || null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const suggestions = [
    "Explain the architecture of this repository.",
    "Where is retry handling implemented?",
    "How does the main request flow work?",
    "What are the most important dependencies between modules?",
  ];

  if (!selectedRepo) return <PageShell title="Ask Your Codebase" subtitle="Get evidence-backed answers about architecture, implementation, and design."><EmptyState icon={Bot} title="Select a repository first" text="Connect a repository and select it from the sidebar to start asking questions." action={onAdd} actionText="Add repository"/></PageShell>;

  return (
    <PageShell title="Ask Your Codebase" subtitle={`Ask questions grounded in ${repoName(selectedRepo)}.`}>
      <div className="ask-layout">
        <main className="ask-main">
          <section className="ask-card">
            <div className="ask-label"><Sparkles size={16}/> AI engineering assistant</div>
            <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") ask(); }} placeholder="Ask anything about your codebase..." />
            <div className="ask-footer">
              <span>Ctrl / ⌘ + Enter to ask</span>
              <div className="ask-controls"><label>Sources <select value={limit} onChange={e => setLimit(e.target.value)}><option value="5">5</option><option value="10">10</option><option value="15">15</option></select></label><button className="primary-btn ask-submit" onClick={() => ask()} disabled={loading || !query.trim()}>{loading ? <Loader2 size={17} className="spin"/> : <Sparkles size={17}/>} Ask</button></div>
            </div>
          </section>

          {error && <ErrorBox error={error} onRetry={() => ask(query)}/>}

          {!result && !loading && <div className="ask-empty"><div className="ask-empty-icon"><Bot size={30}/></div><h3>Your codebase, understood.</h3><p>Use semantic retrieval and repository context to get practical answers backed by actual code.</p><div className="suggestions">{suggestions.map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div></div>}

          {loading && <div className="answer-panel"><Loading text="Retrieving code context and reasoning over the repository..." /></div>}

          {result && !loading && (
            <>
              <section className="answer-panel">
                <div className="answer-head"><div className="answer-title"><Sparkles size={18}/><span>AI Answer</span></div><IconButton title="Copy answer" onClick={() => navigator.clipboard?.writeText(result.answer || "")}><Copy size={16}/></IconButton></div>
                <div className="answer-content">{String(result.answer || result.message || "No answer returned.").split("\n").map((line, i) => <p key={i}>{line || "\u00A0"}</p>)}</div>
              </section>
              <section className="followups"><div className="followup-head"><GitFork size={16}/> Explore further</div>{suggestions.slice(0,3).map(s => <button key={s} onClick={() => ask(s)}>{s}<ArrowRight size={14}/></button>)}</section>
            </>
          )}
        </main>

        <aside className="evidence-panel">
          <SourcesPanel sources={sources} selected={selectedSource} onSelect={setSelectedSource}/>
          <CodePreview source={selectedSource}/>
        </aside>
      </div>
    </PageShell>
  );
}

function SourcesPanel({ sources, selected, onSelect }) {
  return (
    <section className="side-panel">
      <div className="side-panel-head"><div><h3>Sources <Badge>{sources.length}</Badge></h3><p>Retrieved repository evidence</p></div></div>
      {sources.length ? <div className="source-list">{sources.map((s,i) => <button key={i} className={`source-item ${selected === s ? "selected" : ""}`} onClick={() => onSelect(s)}><FileCode2 size={17}/><span><strong>{sourcePath(s).split(/[\\/]/).pop()}</strong><small>{sourcePath(s)}</small></span><em>{sourceScore(s)}</em></button>)}</div> : <div className="side-empty">Sources will appear after asking a question.</div>}
    </section>
  );
}

function CodePreview({ source }) {
  const code = sourceCode(source);
  return (
    <section className="side-panel code-panel">
      <div className="side-panel-head"><div><h3><Code2 size={16}/> Code Preview</h3><p>{source ? `${sourcePath(source)} ${sourceLines(source)}` : "Select a source to preview its code."}</p></div></div>
      {source ? <pre><code>{code || "No code content was returned for this source."}</code></pre> : <div className="code-empty"><Code2 size={28}/><span>Select a source to preview its code.</span></div>}
    </section>
  );
}

function SearchPage({ selectedRepo }) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  async function search() {
    if (!selectedRepo || !q.trim()) return;
    setLoading(true); setError("");
    try {
      const data = await api(`/embeddings/search?repository_id=${encodeURIComponent(repoId(selectedRepo))}&q=${encodeURIComponent(q.trim())}&limit=${limit}`);
      const items = arr(data);
      setResults(items);
      setSelected(items[0] || null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (!selectedRepo) return <PageShell title="Code Search" subtitle="Semantic search across repository code."><EmptyState icon={Search} title="Select a repository" text="Choose a repository before searching its indexed code." /></PageShell>;

  return <PageShell title="Code Search" subtitle={`Semantic search across ${repoName(selectedRepo)}.`}>
    <div className="search-bar">
      <Search size={19}/><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Search for an implementation, function, concept..." /><select value={limit} onChange={e => setLimit(e.target.value)}><option value="5">5 results</option><option value="10">10 results</option><option value="20">20 results</option><option value="50">50 results</option></select><button className="primary-btn" onClick={search} disabled={loading || !q.trim()}>{loading ? <Loader2 className="spin" size={16}/> : <Search size={16}/>} Search</button>
    </div>
    {error && <ErrorBox error={error} onRetry={search}/>}
    <div className="search-layout">
      <section className="panel results-panel"><div className="panel-head"><div><h2>Search results</h2><p>{results.length ? `${results.length} matching code chunks` : "Enter a query to search the indexed code."}</p></div></div>{loading ? <Loading text="Searching indexed code..." /> : results.length ? results.map((r,i) => <button key={i} className={`result-item ${selected === r ? "selected" : ""}`} onClick={() => setSelected(r)}><div className="result-top"><FileCode2 size={16}/><strong>{sourcePath(r)}</strong><Badge>{sourceScore(r) || "match"}</Badge></div><p>{sourceCode(r) || r?.text || r?.content || "Code chunk returned by the search service."}</p><small>{sourceLines(r)}</small></button>) : <div className="panel-empty"><Search size={27}/><span>No results yet.</span></div>}</section>
      <CodePreview source={selected}/>
    </div>
  </PageShell>;
}

function ArchitecturePage({ selectedRepo }) {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!selectedRepo) return;
    setLoading(true); setError("");
    try { setGraph(await api(`/graph/repositories/${repoId(selectedRepo)}`)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [selectedRepo?.repository_id, selectedRepo?.id]);

  const nodes = arr(graph?.nodes ?? graph?.symbols ?? graph?.files);
  const edges = arr(graph?.edges ?? graph?.relationships ?? graph?.links);

  if (!selectedRepo) return <PageShell title="Architecture" subtitle="Explore repository structure and relationships."><EmptyState icon={Network} title="Select a repository" text="Choose a repository to load its knowledge graph." /></PageShell>;

  return <PageShell title="Architecture" subtitle={`Knowledge graph for ${repoName(selectedRepo)}.`} actions={<button className="secondary-btn" onClick={load}><RefreshCw size={16} className={loading ? "spin":""}/> Refresh graph</button>}>
    {error && <ErrorBox error={error} onRetry={load}/>}
    {loading ? <div className="panel"><Loading text="Loading repository graph..." /></div> : <div className="graph-layout">
      <section className="panel graph-panel"><div className="panel-head"><div><h2>Repository graph</h2><p>Graph data returned by the Neo4j-backed API.</p></div><div className="graph-counts"><Badge>{nodes.length} nodes</Badge><Badge>{edges.length} relationships</Badge></div></div>
        {nodes.length ? <GraphCanvas nodes={nodes} edges={edges}/> : <div className="graph-json">{graph ? <pre>{JSON.stringify(graph, null, 2)}</pre> : <div className="panel-empty"><Network size={30}/><span>No graph nodes were returned.</span></div>}</div>}
      </section>
      <section className="panel"><div className="panel-head"><div><h2>Graph data</h2><p>Raw response for debugging and exploration.</p></div></div><pre className="json-view">{JSON.stringify(graph || {}, null, 2)}</pre></section>
    </div>}
  </PageShell>;
}

function GraphCanvas({ nodes, edges }) {
  const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(nodes.length))));
  const width = 900, height = Math.max(440, Math.ceil(nodes.length / cols) * 120);
  const pos = nodes.map((n,i) => ({x: 100 + (i%cols)*(700/Math.max(1,cols-1)), y: 80 + Math.floor(i/cols)*110}));
  const nodeId = n => String(n?.id ?? n?.node_id ?? n?.symbol_id ?? n?.file_id ?? n?.name);
  return <div className="graph-canvas"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
    <defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><polygon points="0 0, 7 3.5, 0 7"/></marker></defs>
    {edges.map((e,i) => {
      const from = String(e?.source ?? e?.from ?? e?.source_id ?? e?.from_id);
      const to = String(e?.target ?? e?.to ?? e?.target_id ?? e?.to_id);
      const a = pos.find((_,j) => nodeId(nodes[j]) === from) || pos[i % pos.length];
      const b = pos.find((_,j) => nodeId(nodes[j]) === to) || pos[(i+1) % pos.length];
      return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="edge" markerEnd="url(#arrow)"/>;
    })}
    {nodes.map((n,i) => <g key={i} transform={`translate(${pos[i].x},${pos[i].y})`}><rect x="-88" y="-28" width="176" height="56" rx="12" className="node"/><text textAnchor="middle" y="-2" className="node-title">{String(n?.name ?? n?.symbol ?? n?.file ?? n?.path ?? `Node ${i+1}`).slice(0,25)}</text><text textAnchor="middle" y="16" className="node-sub">{String(n?.type ?? n?.kind ?? "").slice(0,24)}</text></g>)}
  </svg></div>;
}

function OverviewPage({ repositories, selectedRepo, setPage, onAdd }) {
  const ready = repositories.filter(r => String(r?.status).toUpperCase() === "READY").length;
  return <PageShell title="Engineering Overview" subtitle="A unified view of your repositories, code intelligence, and AI reasoning.">
    <div className="hero">
      <div><Badge tone="purple">AI ENGINEERING INTELLIGENCE</Badge><h2>Understand the codebase.<br/><span>Reason about the system.</span></h2><p>Connect a GitHub repository and use static analysis, semantic retrieval, knowledge graphs, and LLM reasoning from one workspace.</p><div className="hero-actions"><button className="primary-btn" onClick={onAdd}><Plus size={17}/> Add repository</button>{selectedRepo && <button className="secondary-btn" onClick={() => setPage("ask")}><Bot size={17}/> Ask your codebase</button>}</div></div>
      <div className="hero-visual"><div className="orb"><Sparkles size={36}/></div><div className="visual-card one"><Network size={17}/> Knowledge graph</div><div className="visual-card two"><Search size={17}/> Hybrid retrieval</div><div className="visual-card three"><Bot size={17}/> LLM reasoning</div></div>
    </div>
    <div className="feature-grid">
      <Feature icon={Github} title="Repository analysis" text="Clone and analyze GitHub repositories through the backend pipeline."/>
      <Feature icon={Network} title="Knowledge graph" text="Explore files, symbols, callers, callees, parents, children, and dependencies."/>
      <Feature icon={Search} title="Semantic code search" text="Search indexed code using the embeddings service."/>
      <Feature icon={Bot} title="AI reasoning" text="Ask repository-grounded questions and inspect retrieved sources."/>
    </div>
    <div className="stat-grid">
      <div className="stat-card"><span>Repositories</span><strong>{repositories.length}</strong><Database size={20}/></div>
      <div className="stat-card"><span>Ready</span><strong>{ready}</strong><Check size={20}/></div>
      <div className="stat-card"><span>Selected</span><strong className="stat-text">{selectedRepo ? repoName(selectedRepo) : "None"}</strong><CircleDot size={20}/></div>
    </div>
  </PageShell>;
}

function Feature({icon: Icon, title, text}) { return <div className="feature-card"><div className="feature-icon"><Icon size={19}/></div><h3>{title}</h3><p>{text}</p></div>; }

function SettingsPage() {
  const [base, setBase] = useState(API_BASE);
  return <PageShell title="Settings" subtitle="Local frontend configuration.">
    <section className="panel settings-panel"><div className="panel-head"><div><h2>Backend connection</h2><p>The frontend uses this API base URL for all requests.</p></div><Badge tone="green">Configured</Badge></div><label>API base URL</label><input value={base} onChange={e => setBase(e.target.value)} onBlur={() => localStorage.setItem("ri_api_base", base.replace(/\/$/,""))}/><p className="settings-note">Default: http://127.0.0.1:8000. For deployment, set <code>VITE_API_BASE_URL</code> before building.</p><div className="connection-test"><span>Current connection</span><strong>{API_BASE}</strong></div></section>
  </PageShell>;
}

function PageShell({ title, subtitle, actions, children }) {
  return <div className="page"><div className="page-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="page-actions">{actions}</div></div>{children}</div>;
}

export default function App() {
  const [page, setPage] = useState("overview");
  const [repositories, setRepositories] = useState([]);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem("ri_selected_repo") || "");
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [repoError, setRepoError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function refreshRepositories() {
    setLoadingRepos(true); setRepoError("");
    try {
      const data = await api("/repositories/");
      const list = arr(data);
      setRepositories(list);
      const exists = list.some(r => String(repoId(r)) === String(selectedId));
      if (!exists && list[0]) setSelectedId(repoId(list[0]));
    } catch (err) {
      setRepoError(err.message);
    } finally { setLoadingRepos(false); }
  }

  useEffect(() => { refreshRepositories(); }, []);
  useEffect(() => { if (selectedId) localStorage.setItem("ri_selected_repo", selectedId); }, [selectedId]);

  const selectedRepo = repositories.find(r => String(repoId(r)) === String(selectedId)) || null;

  function addCompleted(data) {
    const id = repoId(data);
    if (id != null) { setRepositories(prev => [data, ...prev.filter(r => String(repoId(r)) !== String(id))]); setSelectedId(id); setPage("ask"); }
    else refreshRepositories();
  }

  async function deleteRepo(id) {
    await api(`/repositories/${id}`, {method:"DELETE"});
    if (String(selectedId) === String(id)) setSelectedId("");
    await refreshRepositories();
  }

  let content;
  if (loadingRepos && repositories.length === 0) content = <div className="page"><Loading text="Connecting to the repository intelligence backend..." /></div>;
  else if (repoError && repositories.length === 0) content = <div className="page"><ErrorBox error={repoError} onRetry={refreshRepositories}/><EmptyState icon={Activity} title="Backend connection unavailable" text={`The frontend could not load /repositories/ from ${API_BASE}. Make sure FastAPI is running and CORS allows the frontend origin.`}/></div>;
  else if (page === "overview") content = <OverviewPage repositories={repositories} selectedRepo={selectedRepo} setPage={setPage} onAdd={() => setShowAdd(true)}/>;
  else if (page === "ask") content = <AskPage selectedRepo={selectedRepo} onAdd={() => setShowAdd(true)}/>;
  else if (page === "repositories") content = <RepositoriesPage repositories={repositories} refresh={refreshRepositories} setSelectedId={setSelectedId} setPage={setPage} onAdd={() => setShowAdd(true)}/>;
  else if (page === "architecture") content = <ArchitecturePage selectedRepo={selectedRepo}/>;
  else if (page === "search") content = <SearchPage selectedRepo={selectedRepo}/>;
  else content = <SettingsPage/>;

  return <div className="app">
    <Sidebar page={page} setPage={setPage} repositories={repositories} selectedId={selectedId} setSelectedId={setSelectedId} onAdd={() => setShowAdd(true)}/>
    <div className="main">
      <Topbar selectedRepo={selectedRepo} onRefresh={refreshRepositories} loading={loadingRepos} onAdd={() => setShowAdd(true)}/>
      {content}
      <footer className="footer"><span>Built with FastAPI · Neo4j · PostgreSQL · pgvector · LLM reasoning</span><span>Repository Intelligence v0.1.0</span></footer>
    </div>
    {showAdd && <AddRepositoryModal onClose={() => setShowAdd(false)} onAdded={addCompleted}/>}
  </div>;
}
