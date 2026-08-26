import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Overview from './pages/Overview';
import Repositories from './pages/Repositories';
import RepositoryDetail from './pages/RepositoryDetail';
import Search from './pages/Search';
import Ask from './pages/Ask';
import Settings from './pages/Settings';
import Documentation from './pages/Documentation';
import Architecture from './pages/Architecture';
import CallGraph from './pages/CallGraph';
import ImpactAnalysis from './pages/ImpactAnalysis';
import { useState, useEffect } from 'react';
import { api, type Repository } from './lib/api';

export default function App() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);

  const loadRepositories = async () => {
    setLoadingRepos(true);
    try {
      const data = await api.listRepositories();
      setRepositories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    void loadRepositories();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout repositories={repositories} loadingRepos={loadingRepos} onRefresh={loadRepositories} />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview repositories={repositories} loading={loadingRepos} />} />
          <Route path="/repos" element={<Repositories repositories={repositories} loading={loadingRepos} onRefresh={loadRepositories} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/repos/:id" element={<RepositoryDetail repositories={repositories} onRefresh={loadRepositories} />}>
            <Route index element={<Navigate to="ask" replace />} />
            <Route path="search" element={<Search />} />
            <Route path="ask" element={<Ask />} />
            <Route path="architecture" element={<Architecture />} />
            <Route path="call-graph" element={<CallGraph />} />
            <Route path="impact-analysis" element={<ImpactAnalysis />} />
            <Route path="documentation" element={<Documentation />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
