import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import type { Repository } from '../../lib/api';
import { useState } from 'react';

type AppLayoutProps = {
  repositories: Repository[];
  loadingRepos: boolean;
  onRefresh: () => void;
};

export default function AppLayout({ repositories, loadingRepos, onRefresh }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        repositories={repositories} 
        loading={loadingRepos} 
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          repositories={repositories}
          onRefresh={onRefresh}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
