import { ACTIVE_AGENTS, VENTURE_META } from '../lib/roster';

// ── Mock budget data — replace with live API calls once billing keys are provided ─
const BUDGET_DATA: Record<string, { limit: number; spent: number; inputTokens: number; outputTokens: number }> = {
  'agent-nico':  { limit: 50,  spent: 12.40, inputTokens: 1_820_000, outputTokens: 340_000 },
  'agent-elena': { limit: 100, spent: 38.75, inputTokens: 4_200_000, outputTokens: 980_000 },
  'agent-leo':   { limit: 100, spent: 22.10, inputTokens: 2_600_000, outputTokens: 510_000 },
  'agent-mila':  { limit: 75,  spent: 41.80, inputTokens: 5_100_000, outputTokens: 1_200_000 },
  'agent-marco': { limit: 75,  spent: 19.60, inputTokens: 2_300_000, outputTokens: 450_000 },
  'agent-maya':  { limit: 75,  spent: 28.90, inputTokens: 3_400_000, outputTokens: 720_000 },
};

const DAILY_MOCK: Record<string, number[]> = {
  'agent-nico':  [0.6, 0.8, 0.5, 1.1, 0.9, 0.7, 0.8, 0.6, 1.0, 0.9, 0.8, 1.1, 0.8, 0.9],
  'agent-elena': [2.4, 3.1, 2.8, 2.6, 3.0, 2.5, 2.7, 2.9, 3.2, 2.8, 2.6, 3.0, 2.7, 2.5],
  'agent-leo':   [1.4, 1.8, 1.5, 1.6, 1.7, 1.4, 1.6, 1.8, 1.5, 1.7, 1.4, 1.6, 1.5, 1.7],
  'agent-mila':  [2.8, 3.2, 2.9, 3.0, 3.1, 2.7, 3.3, 2.8, 3.1, 3.0, 2.9, 3.2, 2.7, 3.0],
  'agent-marco': [1.2, 1.5, 1.3, 1.4, 1.6, 1.2, 1.4, 1.5, 1.3, 1.6, 1.2, 1.4, 1.5, 1.3],
  'agent-maya':  [1.9, 2.2, 2.0, 2.1, 2.3, 1.8, 2.1, 2.0, 2.2, 2.1, 1.9, 2.3, 2.0, 2.1],
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 0.01);
  return (
    <div className="flex items-end gap-0.5" style={{ height: '32px' }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.round((v / max) * 100)}%`,
            minHeight: '2px',
            background: color,
            opacity: 0.7 + (i / data.length) * 0.3,
          }}
        />
      ))}
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const barColor = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : color;
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{
          width: `${Math.min(pct, 100)}%`,
          background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
        }}
      />
    </div>
  );
}

export default function BudgetPage() {
  const agents = ACTIVE_AGENTS.filter((a) => BUDGET_DATA[a.id]);
  const totalSpent = agents.reduce((s, a) => s + (BUDGET_DATA[a.id]?.spent ?? 0), 0);
  const totalLimit = agents.reduce((s, a) => s + (BUDGET_DATA[a.id]?.limit ?? 0), 0);
  const totalPct   = Math.round((totalSpent / totalLimit) * 100);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Budget & Cost</h1>
        <span className="badge-pending">⏳ PREVIEW — live data requires billing API keys</span>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        AI model spend by agent · April 2026 · 6 active agents
      </p>

      {/* Company total */}
      <div className="card card-gradient mb-6" style={{ padding: '20px 24px' }}>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Company Total — April 2026</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>${totalSpent.toFixed(2)}</div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>of ${totalLimit.toFixed(0)} monthly budget</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: totalPct >= 75 ? '#f59e0b' : '#34d399' }}>{totalPct}%</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>used</div>
          </div>
        </div>
        <ProgressBar pct={totalPct} color="#3b82f6" />
      </div>

      {/* Per-agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {agents.map((agent) => {
          const b = BUDGET_DATA[agent.id]!;
          const pct = Math.round((b.spent / b.limit) * 100);
          const daily = DAILY_MOCK[agent.id] ?? [];
          const todaySpend = daily[daily.length - 1] ?? 0;
          const vm = VENTURE_META[agent.venture];
          const valueColor = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#34d399';

          return (
            <div key={agent.id} className="card" style={{ padding: '16px' }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${vm.color}33, ${vm.color}1a)`,
                      border: `1px solid ${vm.color}40`,
                      color: vm.accent,
                    }}
                  >
                    {agent.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.role}</div>
                  </div>
                </div>
                <div className="text-lg font-bold" style={{ color: valueColor }}>{pct}%</div>
              </div>

              {/* Budget bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>${b.spent.toFixed(2)} spent</span>
                  <span>${b.limit} limit</span>
                </div>
                <ProgressBar pct={pct} color={vm.color} />
              </div>

              {/* Model */}
              <div className="text-xs font-mono mb-3" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{agent.model}</div>

              {/* Token counts */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div
                  className="rounded-lg px-2 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div style={{ color: 'var(--text-muted)' }}>Input tokens</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{(b.inputTokens / 1_000_000).toFixed(1)}M</div>
                </div>
                <div
                  className="rounded-lg px-2 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div style={{ color: 'var(--text-muted)' }}>Output tokens</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{(b.outputTokens / 1_000_000).toFixed(1)}M</div>
                </div>
              </div>

              {/* Sparkline */}
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>14-day burn</span>
                  <span>${todaySpend.toFixed(2)} today</span>
                </div>
                <Sparkline data={daily} color={vm.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily burn table */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="section-label mb-4">Daily Burn Rate — Last 7 Days</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Agent</th>
                {['Apr 9','Apr 10','Apr 11','Apr 12','Apr 13','Apr 14','Apr 15'].map((d) => (
                  <th key={d} className="text-right py-2 px-2 text-xs" style={{ color: 'var(--text-muted)' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const days = (DAILY_MOCK[agent.id] ?? []).slice(-7);
                const vm = VENTURE_META[agent.venture];
                return (
                  <tr key={agent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: vm.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{agent.name}</span>
                      </div>
                    </td>
                    {days.map((v, i) => (
                      <td key={i} className="text-right py-2 px-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        ${v.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
