import { useState } from 'react';
import { Plus, Trash2, RotateCw, ExternalLink, LoaderCircle } from 'lucide-react';
import { api, type Repository } from '../lib/api';
import { Link } from 'react-router-dom';

function repoName(repo: Repository): string {
  const parts = repo.github_url.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || `Repository ${repo.repository_id}`;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Repositories({ repositories, loading, onRefresh }: { repositories: Repository[], loading: boolean, onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.analyzeRepository({ repository_url: repoUrl.trim() });
      setShowModal(false);
      setRepoUrl('');
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this repository and all its data?')) return;
    try {
      await api.deleteRepository(id);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleRetry = async (url: string) => {
    try {
      await api.analyzeRepository({ repository_url: url });
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Retry failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text tracking-tight">Repositories</h1>
          <p className="text-muted mt-2">Manage connected codebases and track their indexing status.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Repository
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 flex justify-center text-muted"><LoaderCircle className="animate-spin" /></div>
        ) : repositories.length === 0 ? (
          <div className="p-12 text-center text-muted">No repositories connected.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-hover/30 text-xs uppercase tracking-wider text-muted">
                <th className="px-6 py-4 font-medium">Repository</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Added</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {repositories.map(repo => (
                <tr key={repo.repository_id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link to={`/repos/${repo.repository_id}`} className="font-medium text-accent hover:underline flex items-center gap-1.5">
                        {repoName(repo)}
                      </Link>
                      <a href={repo.github_url} target="_blank" rel="noreferrer" className="text-xs text-muted hover:text-text mt-1 flex items-center gap-1">
                        {repo.github_url} <ExternalLink size={10} />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      repo.status === 'READY' ? 'bg-success/10 text-success border-success/20' :
                      repo.status === 'FAILED' ? 'bg-danger/10 text-danger border-danger/20' :
                      'bg-warning/10 text-warning border-warning/20'
                    }`}>
                      {repo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {formatDate(repo.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {repo.status === 'FAILED' && (
                        <button className="p-1.5 text-muted hover:text-text bg-surface-hover rounded-md" onClick={() => handleRetry(repo.github_url)} title="Retry Analysis">
                          <RotateCw size={14} />
                        </button>
                      )}
                      <button className="p-1.5 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-md transition-colors" onClick={() => handleDelete(repo.repository_id)} title="Delete Repository">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false)}}>
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="text-lg font-semibold text-text">Add GitHub Repository</h2>
              <p className="text-sm text-muted mt-1">Connect a public repository for analysis and indexing.</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {error && <div className="text-sm text-danger bg-danger/10 border border-danger/20 p-3 rounded-md">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Repository URL</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border bg-surface-hover/30 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAnalyze} disabled={submitting || !repoUrl.trim()}>
                {submitting ? <LoaderCircle size={16} className="animate-spin" /> : 'Analyze'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
