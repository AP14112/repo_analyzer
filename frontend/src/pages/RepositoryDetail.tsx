import { Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Code2, ExternalLink, RefreshCw } from 'lucide-react';
import type { Repository } from '../lib/api';

export default function RepositoryDetail({ repositories, onRefresh }: { repositories: Repository[], onRefresh: () => void }) {
  const { id } = useParams();
  
  const repo = repositories.find(r => r.repository_id === Number(id));

  if (!repo) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted gap-4 bg-background">
        <Code2 size={48} className="opacity-20" />
        <p>Repository not found or loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-hidden relative">
        <Outlet context={{ repo }} />
      </div>
    </div>
  );
}
