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
import MobilePage from './pages/Mobile';

const TABS = [
  { path: '/',               label: 'Synthesizer',        icon: '◎' },
  { path: '/command',        label: 'Command',             icon: '⬡' },
  { path: '/pipeline',       label: 'Pipeline',            icon: '⇉' },
  { path: '/budget',         label: 'Budget',              icon: '◈' },
  { path: '/security',       label: 'Security',            icon: '⬡' },
  { path: '/infrastructure', label: 'Infrastructure',      icon: '◫' },
];

function Layout({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const kiosk = searchParams.get('kiosk') === '1';

  if (kiosk) {
    return <div className="min-h-screen bg-base">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-base">
      {/* Header */}
      <header
        className="border-b px-6 py-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(to right, rgba(11,17,32,0.95), rgba(6,10,20,0.98))',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}
          >
            Q
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-semibold text-sm tracking-wide">Quorbz</span>
            <span
              className="text-xs font-medium tracking-[0.15em] uppercase px-1.5 py-0.5 rounded"
              style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              Nexus
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.8)', animation: 'pulse-green 2s infinite' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={() => { clearToken(); window.location.href = '/login'; }}
            className="text-xs transition-colors px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav
        className="px-6 flex gap-1 overflow-x-auto"
        style={{
          background: 'rgba(11,17,32,0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `nexus-tab ${isActive ? 'active' : ''}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

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
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/mobile"         element={<MobilePage />} />
        <Route path="/"               element={<ProtectedRoute element={<SynthesizerPage />} />} />
        <Route path="/command"        element={<ProtectedRoute element={<CommandPage />} />} />
        <Route path="/pipeline"       element={<ProtectedRoute element={<PipelinePage />} />} />
        <Route path="/budget"         element={<ProtectedRoute element={<BudgetPage />} />} />
        <Route path="/security"       element={<ProtectedRoute element={<SecurityPage />} />} />
        <Route path="/infrastructure" element={<ProtectedRoute element={<InfrastructurePage />} />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
