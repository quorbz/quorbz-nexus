import type { Agent } from '../lib/roster';
import { VENTURE_META } from '../lib/roster';

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="progress-track">
      <div className={`progress-fill ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

const STRIPE_CLASS: Record<string, string> = {
  ownership: 'venture-stripe-own',
  v1:        'venture-stripe-v1',
  v2:        'venture-stripe-v2',
  v3:        'venture-stripe-v3',
  v4:        'venture-stripe-v4',
  finance:   'venture-stripe-fin',
};

export default function AgentCard({ agent, compact = false }: { agent: Agent; compact?: boolean }) {
  const vm = VENTURE_META[agent.venture];
  const isLive = agent.isActive;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${STRIPE_CLASS[agent.venture]}`}
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', paddingLeft: '12px' }}
      >
        <span className={`status-dot ${agent.status}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{agent.name}</span>
            <span className={`badge-venture ${vm.badgeClass}`}>{vm.label.split(' — ')[0]}</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.role}</div>
        </div>
        {!isLive && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            future
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`card ${STRIPE_CLASS[agent.venture]} ${!isLive ? 'opacity-60' : ''}`} style={{ paddingLeft: '16px' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{agent.role}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${agent.status}`} />
          <span className={`badge-venture ${vm.badgeClass}`}>{vm.label.split(' — ')[0]}</span>
        </div>
      </div>

      {!isLive ? (
        <div className="text-xs rounded-lg px-3 py-2 text-center" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          Deploying {agent.venture === 'v2' ? 'after V1 revenue' : agent.venture === 'v3' ? 'Year 3' : agent.venture === 'v4' ? 'Year 4' : 'future'}
        </div>
      ) : (
        <>
          {/* Vitals */}
          <div className="space-y-2 mb-3">
            {[
              { label: 'CPU', value: agent.cpuPercent, color: agent.cpuPercent > 85 ? 'red' : 'blue' },
              { label: 'RAM', value: agent.ramPercent, color: agent.ramPercent > 85 ? 'yellow' : 'purple' },
              { label: 'Disk', value: agent.diskPercent, color: agent.diskPercent > 88 ? 'red' : 'teal' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  <span>{label}</span><span>{value}%</span>
                </div>
                <Bar value={value} color={color} />
              </div>
            ))}
          </div>

          {/* Machine info */}
          <div className="text-xs font-mono mb-2 truncate" style={{ color: 'var(--text-muted)' }}>{agent.model}</div>

          {/* Current task */}
          {agent.currentTask ? (
            <div
              className="text-xs px-2 py-1.5 rounded-lg truncate"
              style={{ color: '#93c5fd', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              {agent.currentTask}
            </div>
          ) : agent.nanoclaw === false ? (
            <div className="text-xs" style={{ color: '#f87171' }}>⚠ NanoClaw down</div>
          ) : null}

          {/* Uptime */}
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Up {agent.uptime}</div>
        </>
      )}
    </div>
  );
}
