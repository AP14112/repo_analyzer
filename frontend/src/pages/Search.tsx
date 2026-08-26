import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Repository, type SearchResult } from '../lib/api';
import { Search as SearchIcon, LoaderCircle, FileCode2, AlignLeft } from 'lucide-react';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Search() {
  const { repo } = useOutletContext<{ repo: Repository }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await api.searchCode(repo.repository_id, query.trim(), 20);
      setResults(res.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-shrink-0 border-b border-border bg-surface-hover/30 p-6">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input 
            type="text" 
            className="w-full bg-surface border border-border text-text rounded-lg py-3.5 pl-12 pr-24 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-lg shadow-sm placeholder-muted"
            placeholder="Search code semantically (e.g. 'how is authentication handled?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2"
          >
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {error && <div className="text-danger bg-danger/10 border border-danger/20 p-4 rounded-md">{error}</div>}
          
          {!searched && !loading && !error && (
            <div className="flex flex-col items-center justify-center text-muted py-20 gap-4">
              <SearchIcon size={48} className="opacity-20" />
              <p>Enter a query above to search the indexed code chunks using AI embeddings.</p>
            </div>
          )}

          {searched && !loading && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center text-muted py-20 gap-4">
              <AlignLeft size={48} className="opacity-20" />
              <p>No semantic matches found for your query.</p>
            </div>
          )}

          {results.map((r, i) => {
            const res = r as any;
            return (
            <div key={res.id || i} className="card flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-text">
                    <FileCode2 size={16} className="text-accent" />
                    {res.file_path || res.relative_path || 'Unknown File'}
                  </div>
                  {res.symbol_name && (
                    <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded-md text-accent font-mono">
                      {res.symbol_name as string}
                    </span>
                  )}
                  {res.start_line && (
                    <span className="text-xs text-muted">
                      Lines {res.start_line as number}{res.end_line ? `-${res.end_line as number}` : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {res.chunk_type && (
                    <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded text-muted capitalize">
                      {res.chunk_type as string}
                    </span>
                  )}
                  {res.distance != null && typeof res.distance === 'number' && (
                    <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded text-muted" title="Cosine distance">
                      Dist: {res.distance.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-[#0d1117]">
                <SyntaxHighlighter
                  language={res.language?.toLowerCase() || 'python'}
                  style={vscDarkPlus as any}
                  customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem', background: 'transparent' }}
                  showLineNumbers={true}
                  startingLineNumber={res.start_line || 1}
                >
                  {res.content || res.chunk_text || '# No content available'}
                </SyntaxHighlighter>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}
