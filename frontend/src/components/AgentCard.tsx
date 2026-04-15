interface Agent {
  id: string;
  name: string;
  role: string;
  machine: string;
  model: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  lastHeartbeat: string | null;
  currentTask: string | null;
  latestHeartbeat?: {
    cpuPercent?: number;
    ramPercent?: number;
    diskPercent?: number;
    nanoclaw?: boolean;
  } | null;
}

const STATUS_COLORS = {
  online:   'bg-green-400',
  degraded: 'bg-yellow-400',
  offline:  'bg-red-500',
  unknown:  'bg-gray-500',
};

const STATUS_LABELS = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
  unknown: 'Unknown',
};

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default function AgentCard({ agent }: { agent: Agent }) {
  const hb = agent.latestHeartbeat;

  return (
    <div className="card hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-100">{agent.name}</div>
          <div className="text-xs text-gray-500">{agent.role}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${agent.status}`} />
          <span className={`text-xs ${agent.status === 'online' ? 'text-green-400' : agent.status === 'offline' ? 'text-red-400' : 'text-gray-400'}`}>
            {STATUS_LABELS[agent.status]}
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3 space-y-0.5">
        <div>{agent.machine}</div>
        <div className="font-mono text-gray-600">{agent.model}</div>
      </div>

      {hb && (
        <div className="space-y-2 mb-3">
          {hb.cpuPercent !== undefined && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>CPU</span><span>{hb.cpuPercent.toFixed(0)}%</span>
              </div>
              <Bar value={hb.cpuPercent} color={hb.cpuPercent > 85 ? 'bg-red-400' : 'bg-brand-500'} />
            </div>
          )}
          {hb.ramPercent !== undefined && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>RAM</span><span>{hb.ramPercent.toFixed(0)}%</span>
              </div>
              <Bar value={hb.ramPercent} color={hb.ramPercent > 85 ? 'bg-yellow-400' : 'bg-brand-500'} />
            </div>
          )}
          {hb.diskPercent !== undefined && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>Disk</span><span>{hb.diskPercent.toFixed(0)}%</span>
              </div>
              <Bar value={hb.diskPercent} color={hb.diskPercent > 90 ? 'bg-red-400' : 'bg-gray-500'} />
            </div>
          )}
        </div>
      )}

      {agent.currentTask && (
        <div className="text-xs text-brand-300 bg-brand-900/20 border border-brand-800/30 rounded px-2 py-1 truncate">
          {agent.currentTask}
        </div>
      )}

      {agent.lastHeartbeat && (
        <div className="text-xs text-gray-600 mt-2">
          Last seen {new Date(agent.lastHeartbeat).toLocaleTimeString()}
        </div>
      )}

      {hb?.nanoclaw === false && (
        <div className="mt-2 text-xs text-red-400">⚠ NanoClaw process down</div>
      )}
    </div>
  );
}
