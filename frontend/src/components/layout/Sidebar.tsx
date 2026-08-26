import { Link, useLocation } from 'react-router-dom';
import { Sparkles, MessageSquare, GitFork, Network, GitBranch, Activity, Search, BookOpen, Settings, ChevronLeft, Menu, CircleDot, LoaderCircle, Plus } from 'lucide-react';
import type { Repository } from '../../lib/api';

import { useResizable } from '../../lib/useResizable';

const colors = ['#57c99c', '#5fd5a7', '#61a9e7', '#d5a94f', '#bd8570'];

function repoName(repo: Repository): string {
  const parts = repo.github_url.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || `Repository ${repo.repository_id}`;
}

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  repositories: Repository[];
  loading: boolean;
};

export default function Sidebar({ isOpen, setIsOpen, repositories, loading }: SidebarProps) {
  const location = useLocation();
  const { width, startDragging, isDragging } = useResizable(240, 200, 500, 'right');
  
  // Extract repo ID from URL if we are in a repo route
  const match = location.pathname.match(/\/repos\/(\d+)/);
  const activeRepoId = match ? match[1] : repositories[0]?.repository_id?.toString() || '';

  const globalNav = [
    { label: 'Overview', icon: Sparkles, path: '/overview' },
    { label: 'Repositories', icon: GitFork, path: '/repos' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const repoNav = [
    { label: 'Architecture', icon: Network, path: `/repos/${activeRepoId}/architecture` },
    { label: 'Call Graph', icon: GitBranch, path: `/repos/${activeRepoId}/call-graph` },
    { label: 'Impact Analysis', icon: Activity, path: `/repos/${activeRepoId}/impact-analysis` },
    { label: 'Code Search', icon: Search, path: `/repos/${activeRepoId}/search` },
    { label: 'Ask Codebase', icon: MessageSquare, path: `/repos/${activeRepoId}/ask` },
    { label: 'Documentation', icon: BookOpen, path: `/repos/${activeRepoId}/documentation` },
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-1.5 bg-surface border border-border rounded-md hover:bg-surface-hover text-muted hover:text-text transition-colors"
      >
        <Menu size={18} />
      </button>
    );
  }

  return (
    <aside 
      style={{ width: `${width}px` }}
      className={`h-full bg-surface border-r border-border flex flex-col flex-shrink-0 relative ${isDragging ? 'select-none pointer-events-none' : 'transition-colors'}`}
    >
      <div 
        onMouseDown={startDragging}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent/50 active:bg-accent z-50 pointer-events-auto transition-colors"
      />
      <div className="h-14 flex items-center px-4 gap-2">
        <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center text-accent">
          <Sparkles size={14} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm tracking-tight text-text">Repo Intelligence</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-6">
        <div>
          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 px-2">Global</div>
          <nav className="flex flex-col gap-0.5">
            {globalNav.map(({ label, icon: Icon, path }) => {
              const isActive = (path === '/repos' && location.pathname === '/repos') || 
                               (path !== '/repos' && location.pathname.includes(path));
              return (
                <Link
                  key={label}
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-accent/10 text-accent' : 'text-text hover:text-text hover:bg-surface'
                  }`}
                >
                  <Icon size={16} strokeWidth={2} className={isActive ? 'text-accent' : 'text-muted'} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {activeRepoId && (
          <div>
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 px-2">Repository Workspace</div>
            <nav className="flex flex-col gap-0.5">
              {repoNav.map(({ label, icon: Icon, path }) => {
                const isActive = location.pathname.includes(path);
                return (
                  <Link
                    key={label}
                    to={path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-accent/10 text-accent' : 'text-text hover:text-text hover:bg-surface'
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} className={isActive ? 'text-accent' : 'text-muted'} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Your Repositories</span>
            <Link to="/repos" className="text-muted hover:text-text" title="Add Repository"><Plus size={14} /></Link>
          </div>
          <div className="flex flex-col gap-0.5">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted">
                <LoaderCircle size={14} className="animate-spin" />
                Loading...
              </div>
            ) : repositories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted">No repositories</div>
            ) : (
              repositories.map((repo, i) => {
                const active = activeRepoId === repo.repository_id.toString();
                return (
                  <Link
                    key={repo.repository_id}
                    to={`/repos/${repo.repository_id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      active ? 'bg-surface text-text' : 'text-muted hover:bg-surface hover:text-text'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{repoName(repo)}</span>
                      <span className="truncate text-[10px] text-muted">Python · 2 hours ago</span>
                    </div>
                    <CircleDot size={10} className={active ? 'text-accent' : 'opacity-0'} />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <button 
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={16} />
          Minimize
        </button>
      </div>
    </aside>
  );
}
