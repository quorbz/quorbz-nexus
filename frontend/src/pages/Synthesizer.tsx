import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { onWsMessage } from '../lib/ws';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  lastHeartbeat: string | null;
}

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
  agents: Agent[];
  openBlockers: Blocker[];
  criticalIncidents: number;
  todaySpendUsd: number;
  ts: string;
}

// ── Mock feed entries shown until real data exists ─────────────────────────
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

// ── Mock agent status shown until heartbeats arrive ────────────────────────
const MOCK_AGENTS: Agent[] = [
  { id: 'agent-nico',  name: 'Nico',  role: 'CTO',        status: 'online',  lastHeartbeat: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
  { id: 'agent-elena', name: 'Elena', role: 'President',   status: 'online',  lastHeartbeat: new Date(Date.now() - 4 * 60 * 1000).toISOString() },
  { id: 'agent-leo',   name: 'Leo',   role: 'CFO / Legal', status: 'online',  lastHeartbeat: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: 'agent-mila',  name: 'Mila',  role: 'CMO',         status: 'unknown', lastHeartbeat: null },
  { id: 'agent-marco', name: 'Marco', role: 'CPO',         status: 'unknown', lastHeartbeat: null },
  { id: 'agent-maya',  name: 'Maya',  role: 'CSO',         status: 'unknown', lastHeartbeat: null },
];

const TYPE_COLORS: Record<string, string> = {
  briefing:      'border-brand-700 bg-brand-900/20',
  alert:         'border-red-700 bg-red-900/20',
  blocker:       'border-yellow-700 bg-yellow-900/20',
  milestone:     'border-green-700 bg-green-900/20',
  status_change: 'border-gray-700 bg-gray-900/20',
};

const TYPE_ICON: Record<string, string> = {
  briefing:      '📋',
  alert:         '🚨',
  blocker:       '🚫',
  milestone:     '🏆',
  status_change: '🔄',
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
      // Backend not yet deployed — show full mock view
      setSnapshot({
        agents: MOCK_AGENTS,
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

  if (loading) return <div className="text-gray-500 text-sm">Loading Nexus feed…</div>;

  const agents = snapshot?.agents ?? MOCK_AGENTS;
  const onlineCount = agents.filter((a) => a.status === 'online').length;
  const totalCount = agents.length;
  const blockerCount = snapshot?.openBlockers.length ?? 0;

  return (
    <div className={kiosk ? 'p-6 min-h-screen bg-gray-950' : ''}>
      {kiosk && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-brand-400 font-bold text-2xl tracking-widest">QUORBZ</span>
            <span className="text-gray-600 text-sm ml-2">NEXUS</span>
          </div>
          <div className="text-gray-600 text-sm font-mono">{new Date().toLocaleString()}</div>
        </div>
      )}

      {usingMock && !kiosk && (
        <div className="badge-pending mb-4">⏳ PREVIEW — live data available after deployment to DL380</div>
      )}

      {/* Status ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className={`text-2xl font-bold ${onlineCount === totalCount ? 'text-green-400' : onlineCount > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {onlineCount}/{totalCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Agents Online</div>
        </div>
        <div className="card text-center">
          <div className={`text-2xl font-bold ${blockerCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {blockerCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Open Blockers</div>
        </div>
        <div className="card text-center">
          <div className={`text-2xl font-bold ${(snapshot?.criticalIncidents ?? 0) > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {snapshot?.criticalIncidents ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Critical Incidents</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-300">
            ${(snapshot?.todaySpendUsd ?? 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Today's Spend</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent status */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Agent Status</h2>
          <div className="space-y-2">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${a.status}`} />
                  <span className="text-sm text-gray-200">{a.name}</span>
                  <span className="text-xs text-gray-600">{a.role}</span>
                </div>
                <span className="text-xs text-gray-600">
                  {a.lastHeartbeat
                    ? new Date(a.lastHeartbeat).toLocaleTimeString()
                    : 'no heartbeat'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Open blockers */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Open Blockers
            {blockerCount > 0 && <span className="text-red-400 ml-1">({blockerCount})</span>}
          </h2>
          {blockerCount === 0 ? (
            <div className="text-sm text-gray-600">No open blockers</div>
          ) : (
            <div className="space-y-2">
              {(snapshot?.openBlockers ?? []).map((b) => (
                <div key={b.id} className="text-sm border border-yellow-800/40 bg-yellow-900/10 rounded p-2">
                  <div className="font-medium text-yellow-300 truncate">{b.title}</div>
                  <div className="text-xs text-gray-500">{b.assignedTo.name} — {b.blockReason ?? 'No reason'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily agenda / feed */}
        <div className="card lg:row-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Feed
            </h2>
            {usingMock && (
              <span className="text-xs text-gray-600">preview</span>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto max-h-96">
            {feed.map((entry) => (
              <div key={entry.id} className={`rounded p-2 border text-sm ${TYPE_COLORS[entry.type] ?? TYPE_COLORS.status_change}`}>
                <div className="flex items-center gap-1.5 font-medium text-gray-200">
                  <span>{TYPE_ICON[entry.type] ?? '•'}</span>
                  <span className="truncate">{entry.title}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{entry.body}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
