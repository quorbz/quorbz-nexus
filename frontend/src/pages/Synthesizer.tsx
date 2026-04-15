import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { onWsMessage } from '../lib/ws';
import { ACTIVE_AGENTS, VENTURE_META } from '../lib/roster';

interface Blocker {
  id: string;
  title: string;
  blockReason: string | null;
  assignedTo: { name: string };
}

interface FeedEntry {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: number;
  agentId: string | null;
  venture: string | null;
  createdAt: string;
}

interface Snapshot {
  agents: { id: string; name: string; role: string; status: string; lastHeartbeat: string | null }[];
  openBlockers: Blocker[];
  criticalIncidents: number;
  todaySpendUsd: number;
  ts: string;
}

const MOCK_FEED: FeedEntry[] = [
  {
    id: 'm1', type: 'briefing',
    title: 'Daily Briefing — Apr 15',
    body: 'Elena completed 3 product research tasks. Leo reviewed 2 compliance docs. Mila generated 12 digital product listings. No blockers. System uptime 100% across all 6 agents.',
    priority: 10, agentId: null, venture: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'm2', type: 'milestone',
    title: 'NanoClaw-Quorbz pushed to GitHub',
    body: 'xAI/Grok native fork with agent superpowers complete. 17 files changed, 939 insertions. Ready for Elena deployment.',
    priority: 8, agentId: 'agent-nico', venture: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'm3', type: 'status_change',
    title: 'Quorbz Nexus — Stage 1 complete',
    body: '55 files, 3,316 lines. Mission control foundation live on GitHub. Awaiting DL380 deployment.',
    priority: 9, agentId: 'agent-nico', venture: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'm4', type: 'alert',
    title: 'SSH access needed — 4 machines',
    body: 'Mila, Marco, Maya, and Leo machines not yet reachable. Heartbeat agents cannot be deployed until SSH keys are loaded.',
    priority: 6, agentId: null, venture: null,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

const TYPE_CONFIG: Record<string, { icon: string; bg: string; border: string; titleColor: string }> = {
  briefing:      { icon: '◈', bg: 'rgba(59,130,246,0.06)',    border: 'rgba(59,130,246,0.2)',    titleColor: '#93c5fd' },
  alert:         { icon: '⚠', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.25)',    titleColor: '#f87171' },
  blocker:       { icon: '✕', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.25)',   titleColor: '#fbbf24' },
  milestone:     { icon: '✦', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.25)',   titleColor: '#34d399' },
  status_change: { icon: '↻', bg: 'rgba(255,255,255,0.03)',  border: 'rgba(255,255,255,0.08)',  titleColor: 'var(--text-secondary)' },
};

export default function SynthesizerPage() {
  const [searchParams] = useSearchParams();
  const kiosk = searchParams.get('kiosk') === '1';

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  async function refresh() {
    try {
      const [snap, entries] = await Promise.all([
        api.get<Snapshot>('/synthesizer/snapshot'),
        api.get<FeedEntry[]>('/synthesizer/feed?limit=30'),
      ]);
      setSnapshot(snap);
      setFeed(entries.length > 0 ? entries : MOCK_FEED);
      setUsingMock(entries.length === 0);
    } catch {
      setSnapshot({
        agents: ACTIVE_AGENTS.map((a) => ({
          id: a.id, name: a.name, role: a.role, status: a.status,
          lastHeartbeat: a.status === 'online' ? new Date(Date.now() - 3 * 60 * 1000).toISOString() : null,
        })),
        openBlockers: [],
        criticalIncidents: 0,
        todaySpendUsd: 2.87,
        ts: new Date().toISOString(),
      });
      setFeed(MOCK_FEED);
      setUsingMock(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, kiosk ? 30_000 : 60_000);
    const unsub = onWsMessage((msg) => {
      if (['heartbeat_update', 'incident', 'task_update'].includes(msg.type)) refresh();
    });
    return () => { clearInterval(interval); unsub(); };
  }, [kiosk]);

  if (loading) return (
    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      Connecting to Nexus feed…
    </div>
  );

  const agents = snapshot?.agents ?? [];
  const onlineCount = agents.filter((a) => a.status === 'online').length;
  const totalCount = agents.length;
  const blockerCount = snapshot?.openBlockers.length ?? 0;

  return (
    <div className={kiosk ? 'p-6 min-h-screen' : ''} style={kiosk ? { background: 'var(--bg-base)' } : {}}>

      {/* Kiosk header */}
      {kiosk && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
            >
              Q
            </div>
            <div>
              <div className="font-bold text-xl tracking-widest" style={{ color: '#60a5fa' }}>QUORBZ</div>
              <div className="text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>NEXUS MISSION CONTROL</div>
            </div>
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleString()}
          </div>
        </div>
      )}

      {/* Preview banner */}
      {usingMock && !kiosk && (
        <div className="badge-pending mb-4 inline-block">⏳ PREVIEW — live data available after deployment to DL380</div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Agents Online',
            value: `${onlineCount}/${totalCount}`,
            color: onlineCount === totalCount ? '#34d399' : onlineCount > 0 ? '#fbbf24' : '#f87171',
          },
          {
            label: 'Open Blockers',
            value: String(blockerCount),
            color: blockerCount > 0 ? '#f87171' : '#475569',
          },
          {
            label: 'Critical Incidents',
            value: String(snapshot?.criticalIncidents ?? 0),
            color: (snapshot?.criticalIncidents ?? 0) > 0 ? '#f87171' : '#475569',
          },
          {
            label: "Today's Spend",
            value: `$${(snapshot?.todaySpendUsd ?? 0).toFixed(2)}`,
            color: 'var(--text-secondary)',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center" style={{ padding: '16px' }}>
            <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Agent status */}
        <div className="card" style={{ padding: '16px' }}>
          <div className="section-label mb-4">Agent Status</div>
          <div className="space-y-2">
            {agents.map((a) => {
              const rosterAgent = ACTIVE_AGENTS.find((r) => r.id === a.id);
              const vm = rosterAgent ? VENTURE_META[rosterAgent.venture] : null;
              return (
                <div key={a.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${a.status}`} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.name}</span>
                    {vm && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: vm.color }} />
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {a.lastHeartbeat
                      ? new Date(a.lastHeartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'no heartbeat'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Open blockers */}
        <div className="card" style={{ padding: '16px' }}>
          <div className="section-label mb-4">
            Open Blockers
            {blockerCount > 0 && <span style={{ color: '#f87171', marginLeft: '4px' }}>({blockerCount})</span>}
          </div>
          {blockerCount === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No open blockers — all clear</div>
          ) : (
            <div className="space-y-2">
              {(snapshot?.openBlockers ?? []).map((b) => (
                <div
                  key={b.id}
                  className="text-sm rounded-lg p-2"
                  style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)' }}
                >
                  <div className="font-medium truncate" style={{ color: '#fbbf24' }}>{b.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {b.assignedTo.name} — {b.blockReason ?? 'No reason'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="card lg:row-span-2" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="section-label">Nexus Feed</div>
            {usingMock && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>preview</span>}
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '480px' }}>
            {feed.map((entry) => {
              const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.status_change;
              return (
                <div
                  key={entry.id}
                  className="rounded-lg p-2.5"
                  style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span style={{ color: cfg.titleColor, fontSize: '12px' }}>{cfg.icon}</span>
                    <span className="text-sm font-medium truncate" style={{ color: cfg.titleColor }}>{entry.title}</span>
                  </div>
                  <div className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{entry.body}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                    {new Date(entry.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
