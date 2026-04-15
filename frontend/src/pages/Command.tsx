import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { onWsMessage } from '../lib/ws';
import AgentCard from '../components/AgentCard';

interface Agent {
  id: string;
  name: string;
  role: string;
  machine: string;
  ip: string;
  os: string;
  model: string;
  hierarchyLevel: number;
  reportsTo: string | null;
  venture: string | null;
  isActive: boolean;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  lastHeartbeat: string | null;
  currentTask: string | null;
  latestHeartbeat: {
    cpuPercent?: number;
    ramPercent?: number;
    diskPercent?: number;
    nanoclaw?: boolean;
  } | null;
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Founder',
  1: 'Ownership Layer',
  2: 'Executive',
  3: 'Lead',
  4: 'Contributor',
};

export default function CommandPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api.get<Agent[]>('/agents');
    setAgents(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const unsub = onWsMessage((msg) => {
      if (msg.type === 'heartbeat_update') load();
    });
    return unsub;
  }, []);

  if (loading) return <div className="text-gray-500 text-sm">Loading agents…</div>;

  // Group by hierarchy level
  const levels = [...new Set(agents.map((a) => a.hierarchyLevel))].sort();

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-200 mb-6">Agent Command</h1>

      {levels.map((level) => {
        const group = agents.filter((a) => a.hierarchyLevel === level);
        return (
          <div key={level} className="mb-8">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-gray-800 inline-flex items-center justify-center text-gray-400">{level}</span>
              {LEVEL_LABELS[level] ?? `Level ${level}`}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
