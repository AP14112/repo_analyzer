import { Activity, Database, GitFork, LoaderCircle } from 'lucide-react';
import type { Repository } from '../lib/api';
import { Link } from 'react-router-dom';

type OverviewProps = {
  repositories: Repository[];
  loading: boolean;
};

export default function Overview({ repositories, loading }: OverviewProps) {
  const readyCount = repositories.filter(r => r.status === 'READY').length;

  return (
    <div className="max-w-5xl mx-auto p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold text-text tracking-tight">Overview</h1>
        <p className="text-muted mt-2">High-level metrics for your connected AI engineering intelligence platform.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-muted">
          <LoaderCircle className="animate-spin" /> Loading metrics...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted font-medium">
              <GitFork size={18} />
              Connected Repositories
            </div>
            <div className="text-4xl font-semibold text-text">{repositories.length}</div>
            <div className="text-sm text-muted">Tracked in PostgreSQL</div>
          </div>

          <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted font-medium">
              <Database size={18} />
              Indexed & Ready
            </div>
            <div className="text-4xl font-semibold text-accent">{readyCount}</div>
            <div className="text-sm text-muted">Available for semantic search</div>
          </div>

          <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted font-medium">
              <Activity size={18} />
              Platform Status
            </div>
            <div className="text-4xl font-semibold text-success">Online</div>
            <div className="text-sm text-muted">API backend responding</div>
          </div>
        </div>
      )}

      <div className="card p-8 flex flex-col items-center justify-center text-center gap-4 mt-8 bg-surface-hover/30 border-dashed">
        <GitFork size={32} className="text-muted" />
        <div>
          <h3 className="text-lg font-medium text-text">Start exploring your code</h3>
          <p className="text-sm text-muted mt-1 max-w-md">Connect a repository to index its files, symbols, graph relationships, and generate semantic embeddings.</p>
        </div>
        <Link to="/repos" className="btn-primary mt-2">Manage Repositories</Link>
      </div>
    </div>
  );
}
