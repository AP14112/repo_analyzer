import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Repository } from '../lib/api';
import { BookOpen, FileCode, Folder, Hash, ListTree, Beaker, Package, AlignLeft, Search, LoaderCircle, Network, Code, Layers, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Documentation() {
  const { repo } = useOutletContext<{ repo: Repository }>();
  const [stats, setStats] = useState<any>(null);
  const [graph, setGraph] = useState<any>(null);
  const [edges, setEdges] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Generated Documentation State
  const [docQuery, setDocQuery] = useState('');
  const [docGenerating, setDocGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsData, graphData, edgesData, searchRes] = await Promise.all([
          api.getRepositoryStats(repo.repository_id).catch(() => null),
          api.getRepositoryGraph(repo.repository_id).catch(() => ({ files: [] })),
          api.getRepositoryEdges(repo.repository_id).catch(() => ({ edges: [] })),
          api.searchCode(repo.repository_id, "class interface function def main app", 20).catch(() => ({ results: [] }))
        ]);
        
        if (statsData) setStats(statsData);
        if (graphData) setGraph(graphData);
        if (edgesData) setEdges(edgesData.edges || []);
        
        if (searchRes && searchRes.results) {
          // filter unique symbols
          const unique = new Map();
          searchRes.results.forEach((r: any) => {
            if (r.symbol_name && !unique.has(r.symbol_name)) {
              unique.set(r.symbol_name, r);
            }
          });
          setSymbols(Array.from(unique.values()).slice(0, 10)); // Top 10
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [repo.repository_id]);

  const handleGenerateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docQuery.trim()) return;
    
    setDocGenerating(true);
    setGeneratedDoc(null);
    try {
      const res = await api.askCodebase(repo.repository_id, `Generate comprehensive technical documentation for: ${docQuery}`);
      setGeneratedDoc(res);
    } catch (err: any) {
      setGeneratedDoc({ error: err.message || 'Failed to generate documentation' });
    } finally {
      setDocGenerating(false);
    }
  };

  const getModuleCount = () => {
    const moduleNames = new Set(edges.filter(e => e.type === 'IMPORTS').map(e => e.target_name));
    return moduleNames.size;
  };

  const getDependenciesCount = () => {
    return edges.filter(e => e.type === 'IMPORTS').length;
  };

  if (loading) return <div className="p-8 text-muted flex items-center gap-2"><LoaderCircle className="animate-spin" /> Loading documentation...</div>;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
        <h1 className="text-lg font-bold text-text flex items-center gap-2">
          <BookOpen className="text-accent" size={20} />
          Repository Documentation
        </h1>
        <div className="text-sm text-muted bg-background px-3 py-1.5 rounded-md border border-border">
          {repo.github_url.split('/').pop()}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-56 border-r border-border bg-surface/30 p-4 flex flex-col gap-1 overflow-y-auto">
          {[
            { id: 'overview', icon: <AlignLeft size={16}/>, label: 'Overview' },
            { id: 'architecture', icon: <Network size={16}/>, label: 'Architecture' },
            { id: 'components', icon: <Package size={16}/>, label: 'Key Components' },
            { id: 'api', icon: <Code size={16}/>, label: 'API / Interfaces' },
            { id: 'dependencies', icon: <Layers size={16}/>, label: 'Dependencies' },
            { id: 'structure', icon: <Folder size={16}/>, label: 'Code Structure' },
            { id: 'symbols', icon: <Beaker size={16}/>, label: 'Key Symbols' },
            { id: 'generated', icon: <Sparkles size={16}/>, label: 'Generated Docs' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${activeTab === tab.id ? 'bg-accent/10 text-accent font-medium' : 'text-muted hover:text-text hover:bg-surface-hover'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-background">
          <div className="max-w-4xl mx-auto">
            
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-text mb-2">{stats?.name || repo.github_url.split('/').pop()}</h2>
                  <p className="text-muted">Indexed repository overview and statistics.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {[
                    { label: 'Language', val: stats?.language || 'Mixed' },
                    { label: 'Files', val: stats?.file_count || 0 },
                    { label: 'Functions', val: stats?.function_count || 0 },
                    { label: 'Classes', val: stats?.class_count || 0 },
                    { label: 'Modules', val: getModuleCount() },
                    { label: 'Edges', val: edges.length },
                  ].map((s, i) => (
                    <div key={i} className="bg-surface p-4 rounded-lg border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted mb-1 font-semibold">{s.label}</div>
                      <div className="text-xl font-bold text-text truncate">{s.val}</div>
                    </div>
                  ))}
                </div>

                <div className="prose prose-invert max-w-none">
                  <h3>Repository Summary</h3>
                  <p>
                    This repository consists of <strong>{stats?.file_count || 0}</strong> files and organizes logic into <strong>{getModuleCount()}</strong> distinct imported modules. 
                    The static analysis engine has extracted <strong>{stats?.function_count || 0}</strong> functions and <strong>{stats?.class_count || 0}</strong> classes 
                    which form the semantic graph of the codebase.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'architecture' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-text">Architecture</h2>
                <div className="prose prose-invert max-w-none">
                  <p>
                    The architecture of this project is driven by its module imports. 
                    There are <strong>{getDependenciesCount()}</strong> identified <code>IMPORTS</code> relationships across the repository files.
                  </p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-text mb-4 uppercase tracking-wider">Top Modules by Incoming Imports</h3>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const counts: Record<string, number> = {};
                      edges.filter(e => e.type === 'IMPORTS').forEach(e => {
                        counts[e.target_name] = (counts[e.target_name] || 0) + 1;
                      });
                      return Object.entries(counts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 15)
                        .map(([mod, count], i) => (
                          <div key={i} className="flex justify-between items-center p-2 hover:bg-surface-hover rounded">
                            <code className="text-accent text-sm">{mod}</code>
                            <span className="text-xs text-muted bg-background px-2 py-1 rounded-full border border-border">{count} imports</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'components' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-text">Key Components</h2>
                <p className="text-muted mb-4">Core entities extracted from semantic analysis of the codebase.</p>
                <div className="grid gap-4">
                  {symbols.filter(s => s.chunk_type === 'class' || s.chunk_type === 'function').map(sym => (
                    <div key={sym.symbol_id || sym.chunk_id} className="bg-surface border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-background text-xs text-muted uppercase font-semibold mb-1 mr-2 border border-border">
                            {sym.chunk_type}
                          </span>
                          <span className="text-base font-bold text-accent font-mono">{sym.symbol_name}</span>
                        </div>
                        <span className="text-xs text-muted truncate max-w-[200px]">{sym.file_path?.split(/[\\/]/).pop()}</span>
                      </div>
                      <p className="text-sm text-text mt-2 line-clamp-2">
                        Found in {sym.file_path} at line {sym.start_line}.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-text">API / Interfaces</h2>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm text-yellow-500">
                  Showing public functions, interfaces, and routes extracted from the graph.
                </div>
                <div className="grid gap-2">
                  {symbols.filter(s => s.chunk_type === 'function').map((sym, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                      <code className="text-accent text-sm font-bold">{sym.symbol_name}()</code>
                      <div className="text-xs text-muted">{sym.file_path?.split(/[\\/]/).pop()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'dependencies' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-text">Dependencies</h2>
                <div className="prose prose-invert max-w-none mb-6">
                  <p>File-level structural dependencies. Displays which files depend on external or internal modules.</p>
                </div>
                <div className="grid gap-3">
                  {(() => {
                    const fileDeps: Record<string, Set<string>> = {};
                    edges.filter(e => e.type === 'IMPORTS').forEach(e => {
                      if (!fileDeps[e.source_name]) fileDeps[e.source_name] = new Set();
                      fileDeps[e.source_name].add(e.target_name);
                    });
                    return Object.entries(fileDeps).slice(0, 20).map(([file, deps], i) => (
                      <div key={i} className="bg-surface border border-border rounded-lg p-4">
                        <div className="font-mono text-sm text-text font-bold mb-2">{file}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(deps).map((d, j) => (
                            <span key={j} className="text-xs bg-background text-muted px-2 py-1 rounded border border-border">{d}</span>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'structure' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-text">Code Structure</h2>
                <p className="text-muted">Repository file index mapping.</p>
                <div className="bg-surface border border-border rounded-lg p-4 font-mono text-sm text-text">
                  <ul className="space-y-1 overflow-y-auto max-h-[500px]">
                    {(graph?.files || []).slice(0, 100).map((f: any, i: number) => (
                      <li key={i} className="flex items-center gap-2 py-1 border-b border-border/50 last:border-0 hover:bg-surface-hover">
                        <FileCode size={14} className="text-muted" /> {f.relative_path || f.name}
                      </li>
                    ))}
                    {(graph?.files?.length || 0) > 100 && (
                      <li className="text-muted text-xs italic mt-2">... and {(graph?.files?.length || 0) - 100} more files.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'symbols' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-text">Key Symbols</h2>
                <div className="space-y-4">
                  {symbols.map(sym => (
                    <div key={sym.symbol_id || sym.chunk_id} className="bg-surface border border-border rounded-lg overflow-hidden">
                      <div className="p-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-background px-2 py-0.5 rounded border border-border">{sym.chunk_type}</span>
                          <span className="text-base font-bold text-accent font-mono">{sym.symbol_name}</span>
                        </div>
                        <span className="text-xs text-muted font-mono">{sym.file_path}</span>
                      </div>
                      <div className="p-4 bg-surface-hover overflow-auto max-h-60 text-xs font-mono text-text">
                        <pre><code>{sym.content || sym.chunk_text || 'No snippet available.'}</code></pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'generated' && (
              <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full min-h-[600px]">
                <h2 className="text-2xl font-bold text-text">Generated Documentation</h2>
                <p className="text-muted">Query the codebase to generate grounded architectural documentation, how-to guides, or technical specifications.</p>
                
                <form onSubmit={handleGenerateDoc} className="flex gap-2">
                  <input
                    type="text"
                    value={docQuery}
                    onChange={e => setDocQuery(e.target.value)}
                    placeholder="e.g. 'Authentication flow', 'Request routing', 'Database models'"
                    className="flex-1 bg-surface border border-border px-4 py-2 rounded-md text-sm text-text focus:outline-none focus:border-accent"
                    disabled={docGenerating}
                  />
                  <button 
                    type="submit" 
                    disabled={docGenerating || !docQuery.trim()}
                    className="bg-accent text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {docGenerating ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Generate
                  </button>
                </form>

                <div className="flex-1 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
                  {docGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted p-12">
                      <LoaderCircle size={32} className="animate-spin text-accent mb-4" />
                      <p>Retrieving context and generating documentation...</p>
                    </div>
                  ) : generatedDoc ? (
                    generatedDoc.error ? (
                      <div className="p-6 text-red-500 bg-red-500/10 m-4 rounded-md text-sm border border-red-500/20">
                        {generatedDoc.error}
                      </div>
                    ) : (
                      <div className="flex-1 overflow-auto p-6 lg:p-8">
                        {generatedDoc.sources?.length === 0 && (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-md text-sm mb-6">
                            No exact source matches found. Documentation generated from general knowledge.
                          </div>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none text-text">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {generatedDoc.answer}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted p-12 opacity-50">
                      <FileCode size={48} className="mb-4" />
                      <p>Select a topic or file to generate grounded documentation.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
