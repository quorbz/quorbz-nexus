import { ACTIVE_AGENTS, VENTURE_META } from '../lib/roster';

function MiniBar({ value, warn = 75, danger = 90, color }: { value: number; warn?: number; danger?: number; color: string }) {
  const barColor = value >= danger ? '#ef4444' : value >= warn ? '#f59e0b' : color;
  return (
    <div className="flex items-center gap-2">
      <div className="progress-track flex-1">
        <div
          className="progress-fill"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${barColor}99, ${barColor})` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--text-muted)' }}>{value}%</span>
    </div>
  );
}

export default function InfrastructurePage() {
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL ?? '';

  if (grafanaUrl) {
    return (
      <div className="h-full">
        <h1 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Infrastructure</h1>
        <iframe
          src={grafanaUrl}
          className="w-full rounded-xl"
          style={{ height: 'calc(100vh - 160px)', border: '1px solid var(--border-subtle)' }}
          title="Grafana Dashboards"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Infrastructure</h1>
        <span className="badge-pending">⏳ PREVIEW — Grafana deploys to DL380 with Stage 2</span>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Machine vitals · Nextcloud · 6 agent nodes · Live Grafana embeds in Stage 2
      </p>

      {/* Machine grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {ACTIVE_AGENTS.map((agent) => {
          const vm = VENTURE_META[agent.venture];
          return (
            <div key={agent.id} className="card" style={{ padding: '16px' }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${vm.color}33, ${vm.color}1a)`,
                      border: `1px solid ${vm.color}50`,
                      color: vm.accent,
                    }}
                  >
                    {agent.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.machine}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{agent.ip}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.os}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Up {agent.uptime}</div>
                </div>
              </div>

              {/* Vitals */}
              <div className="space-y-2 mb-3">
                {[
                  { label: 'CPU',  value: agent.cpuPercent },
                  { label: 'RAM',  value: agent.ramPercent },
                  { label: 'Disk', value: agent.diskPercent, warn: 80, danger: 90 },
                ].map(({ label, value, warn, danger }) => (
                  <div key={label}>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
                    <MiniBar value={value} warn={warn} danger={danger} color={vm.color} />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className={`status-dot ${agent.status}`} />
                <div
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: agent.nanoclaw ? '#34d399' : '#f87171' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: agent.nanoclaw ? '#34d399' : '#ef4444',
                      boxShadow: agent.nanoclaw ? '0 0 6px rgba(52,211,153,0.6)' : 'none',
                    }}
                  />
                  NanoClaw {agent.nanoclaw ? 'running' : 'down'}
                </div>
              </div>

              {/* Current task */}
              {agent.currentTask && (
                <div
                  className="text-xs mt-2 pt-2 truncate"
                  style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  ↳ {agent.currentTask}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nextcloud */}
      <div className="card mb-4" style={{ padding: '16px 20px' }}>
        <div className="section-label mb-4">Nextcloud — DL380 (52TB)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Storage Used', value: '8.4 TB', sub: <MiniBar value={16} warn={70} danger={85} color="#3b82f6" /> },
            { label: 'Sync Status',  value: '✓ Healthy', valueColor: '#34d399', sub: null },
            { label: 'Last Backup',  value: 'Apr 15, 03:00', sub: null },
            { label: 'Service',      value: 'Online', valueColor: '#34d399', sub: null },
          ].map(({ label, value, valueColor, sub }) => (
            <div key={label}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="text-sm font-medium mb-1" style={{ color: valueColor ?? 'var(--text-primary)' }}>{value}</div>
              {sub}
            </div>
          ))}
        </div>
      </div>

      {/* Stage 2 preview */}
      <div
        className="card"
        style={{ padding: '16px 20px', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="section-label mb-3" style={{ color: 'var(--text-muted)' }}>Added in Stage 2 — Grafana Live</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          {[
            'Live time-series charts per machine (not just current values)',
            'Historical CPU/RAM/disk trends — last 24h, 7d, 30d',
            'Network traffic inbound/outbound per machine',
            'Cost per model type — Sonnet vs Grok burn comparison',
            'Token usage rate and cache hit rate',
            'Uptime SLA tracker — 99.5% target per agent',
            'Anomaly alerts — spike detection across all metrics',
          ].map((item) => (
            <div key={item}>• {item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
