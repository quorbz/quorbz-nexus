import { useEffect, useState, useRef } from 'react';
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

const TYPE_COLORS: Record<string, string> = {
  briefing:      'border-brand-700 bg-brand-900/20',
  alert:         'border-red-700 bg-red-900/20',
  blocker:       'border-yellow-700 bg-yellow-900/20',
  milestone:     'border-green-700 bg-green-900/20',
  status_change: 'border-gray-700 bg-gray-900/20',
};

const TYPE_ICON: Record<string, string> = {
  briefing: '📋',
  alert:    '🚨',
  blocker:  '🚫',
  milestone:'🏆',
  status_change: '🔄',
};

export default function SynthesizerPage() {
  const [searchParams] = useSearchParams();
  const kiosk = searchParams.get('kiosk') === '1';

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [snap, entries] = await Promise.all([
      api.get<Snapshot>('/synthesizer/snapshot'),
      api.get<FeedEntry[]>('/synthesizer/feed?limit=30'),
    ]);
    setSnapshot(snap);
    setFeed(entries);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, kiosk ? 30_000 : 60_000);
    const unsub = onWsMessage((msg) => {
      if (['heartbeat_update', 'incident', 'task_update'].includes(msg.type)) {
        refresh();
      }
    });
    return () => { clearInterval(interval); unsub(); };
  }, [kiosk]);

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading Nexus feed…</div>;
  }

  const onlineCount = snapshot?.agents.filter((a) => a.status === 'online').length ?? 0;
  const totalCount = snapshot?.agents.length ?? 0;
  const blockerCount = snapshot?.openBlockers.length ?? 0;

  return (
    <div className={kiosk ? 'p-6 min-h-screen bg-gray-950' : ''}>
      {kiosk && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-brand-400 font-bold text-2xl tracking-widest">QUORBZ</span>
            <span className="text-gray-600 text-sm ml-2">NEXUS</span>
          </div>
          <div className="text-gray-600 text-sm font-mono">
            {new Date().toLocaleString()}
          </div>
        </div>
      )}

      {/* Status ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className={`text-2xl font-bold ${onlineCount === totalCount ? 'text-green-400' : 'text-yellow-400'}`}>
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
        {/* Agent status grid */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Agent Status</h2>
          <div className="space-y-2">
            {(snapshot?.agents ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${a.status}`} />
                  <span className="text-sm text-gray-200">{a.name}</span>
                  <span className="text-xs text-gray-600">{a.role}</span>
                </div>
                {a.lastHeartbeat && (
                  <span className="text-xs text-gray-600">
                    {new Date(a.lastHeartbeat).toLocaleTimeString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Open blockers */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Open Blockers {blockerCount > 0 && <span className="text-red-400">({blockerCount})</span>}
          </h2>
          {blockerCount === 0 ? (
            <div className="text-sm text-gray-600">No open blockers</div>
          ) : (
            <div className="space-y-2">
              {(snapshot?.openBlockers ?? []).map((b) => (
                <div key={b.id} className="text-sm border border-yellow-800/40 bg-yellow-900/10 rounded p-2">
                  <div className="font-medium text-yellow-300 truncate">{b.title}</div>
                  <div className="text-xs text-gray-500">{b.assignedTo.name} — {b.blockReason ?? 'No reason given'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily agenda / feed */}
        <div className="card lg:row-span-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Feed <span className="text-gray-600 normal-case tracking-normal font-normal">last 24h</span>
          </h2>
          {feed.length === 0 ? (
            <div className="text-sm text-gray-600">No entries yet</div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-96">
              {feed.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded p-2 border text-sm ${TYPE_COLORS[entry.type] ?? TYPE_COLORS.status_change}`}
                >
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
          )}
        </div>
      </div>
    </div>
  );
}
