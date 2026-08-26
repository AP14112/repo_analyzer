import { BookOpen, ChevronDown, Sun, Moon, Sparkles } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import type { Repository } from '../../lib/api';
import { useState, useEffect } from 'react';

type HeaderProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  repositories: Repository[];
  onRefresh: () => void;
};

export default function Header({ sidebarOpen, setSidebarOpen, repositories, onRefresh }: HeaderProps) {
  const location = useLocation();
  const match = location.pathname.match(/\/repos\/(\d+)/);
  const activeRepoId = match ? match[1] : null;
  const activeRepo = repositories.find(r => r.repository_id.toString() === activeRepoId);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-surface sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <div className="flex flex-col">
             <span className="font-bold text-text text-sm tracking-tight flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center text-accent"><Sparkles size={12} strokeWidth={2.5} /></div>Repo Intelligence</span>
          </div>
        )}
        <div className="flex flex-col border-l border-border pl-4 ml-2">
          <span className="text-sm font-semibold text-text">Repository Intelligence</span>
          <span className="text-xs text-muted">AI-Powered understanding of your entire codebase</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="text-muted hover:text-text transition-colors p-1.5 rounded-md hover:bg-surface-hover"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="h-4 w-px bg-border mx-1" />
        <button className="flex items-center gap-2 text-sm font-medium text-muted hover:text-text transition-colors pl-1">
          <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold">AU</div>
          Admin User
          <ChevronDown size={14} className="text-muted" />
        </button>
      </div>
    </header>
  );
}
