import { BrowserRouter, Routes, Route, Navigate, NavLink, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { isAuthenticated, clearToken } from './lib/api';
import { connectWs } from './lib/ws';

import LoginPage from './pages/Login';
import SynthesizerPage from './pages/Synthesizer';
import CommandPage from './pages/Command';
import PipelinePage from './pages/Pipeline';
import BudgetPage from './pages/Budget';
import SecurityPage from './pages/Security';
import InfrastructurePage from './pages/Infrastructure';

const TABS = [
  { path: '/',               label: 'Synthesizer' },
  { path: '/command',        label: 'Command' },
  { path: '/pipeline',       label: 'Pipeline' },
  { path: '/budget',         label: 'Budget' },
  { path: '/security',       label: 'Security / Network' },
  { path: '/infrastructure', label: 'Infrastructure' },
];

function Layout({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const kiosk = searchParams.get('kiosk') === '1';

  if (kiosk) {
    // Kiosk mode: no nav, just content (for rack monitor)
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-brand-400 font-bold text-lg tracking-wider">QUORBZ</span>
          <span className="text-gray-500 text-sm">NEXUS</span>
        </div>
        <button
          onClick={() => { clearToken(); window.location.href = '/login'; }}
          className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Tab bar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <Layout>{element}</Layout>;
}

export default function App() {
  useEffect(() => {
    if (isAuthenticated()) connectWs();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/"               element={<ProtectedRoute element={<SynthesizerPage />} />} />
        <Route path="/command"        element={<ProtectedRoute element={<CommandPage />} />} />
        <Route path="/pipeline"       element={<ProtectedRoute element={<PipelinePage />} />} />
        <Route path="/budget"         element={<ProtectedRoute element={<BudgetPage />} />} />
        <Route path="/security"       element={<ProtectedRoute element={<SecurityPage />} />} />
        <Route path="/infrastructure" element={<ProtectedRoute element={<InfrastructurePage />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
