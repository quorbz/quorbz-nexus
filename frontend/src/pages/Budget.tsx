import { useState } from 'react';

// ── Mock data — replace with live API calls once billing keys are provided ────
const MOCK_AGENTS = [
  { id: 'agent-nico',  name: 'Nico',  role: 'CTO',        model: 'claude-sonnet-4-6',        limit: 50,  spent: 12.40, inputTokens: 1_820_000, outputTokens: 340_000 },
  { id: 'agent-elena', name: 'Elena', role: 'President',   model: 'grok-4-1-fast-reasoning',  limit: 100, spent: 38.75, inputTokens: 4_200_000, outputTokens: 980_000 },
  { id: 'agent-leo',   name: 'Leo',   role: 'CFO / Legal', model: 'grok-4-1-fast-reasoning',  limit: 100, spent: 22.10, inputTokens: 2_600_000, outputTokens: 510_000 },
  { id: 'agent-mila',  name: 'Mila',  role: 'CMO',         model: 'grok-4-1-fast-reasoning',  limit: 75,  spent: 41.80, inputTokens: 5_100_000, outputTokens: 1_200_000 },
  { id: 'agent-marco', name: 'Marco', role: 'CPO',         model: 'grok-4-1-fast-reasoning',  limit: 75,  spent: 19.60, inputTokens: 2_300_000, outputTokens: 450_000 },
  { id: 'agent-maya',  name: 'Maya',  role: 'CSO',         model: 'grok-4-1-fast-reasoning',  limit: 75,  spent: 28.90, inputTokens: 3_400_000, outputTokens: 720_000 },
];

// Fake 14-day daily spend per agent (USD)
const DAILY_MOCK: Record<string, number[]> = {
  'agent-nico':  [0.6, 0.8, 0.5, 1.1, 0.9, 0.7, 0.8, 0.6, 1.0, 0.9, 0.8, 1.1, 0.8, 0.9],
  'agent-elena': [2.4, 3.1, 2.8, 2.6, 3.0, 2.5, 2.7, 2.9, 3.2, 2.8, 2.6, 3.0, 2.7, 2.5],
  'agent-leo':   [1.4, 1.8, 1.5, 1.6, 1.7, 1.4, 1.6, 1.8, 1.5, 1.7, 1.4, 1.6, 1.5, 1.7],
  'agent-mila':  [2.8, 3.2, 2.9, 3.0, 3.1, 2.7, 3.3, 2.8, 3.1, 3.0, 2.9, 3.2, 2.7, 3.0],
  'agent-marco': [1.2, 1.5, 1.3, 1.4, 1.6, 1.2, 1.4, 1.5, 1.3, 1.6, 1.2, 1.4, 1.5, 1.3],
  'agent-maya':  [1.9, 2.2, 2.0, 2.1, 2.3, 1.8, 2.1, 2.0, 2.2, 2.1, 1.9, 2.3, 2.0, 2.1],
};

function Sparkline({ data, color = 'bg-brand-500' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 0.01);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${color}`}
          style={{ height: `${Math.round((v / max) * 100)}%`, minHeight: '2px' }}
        />
      ))}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-400' : 'bg-brand-500';
  return (
    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function BudgetPage() {
  const [liveMode] = useState(false); // flip to true once billing keys provided

  const totalSpent = MOCK_AGENTS.reduce((s, a) => s + a.spent, 0);
  const totalLimit = MOCK_AGENTS.reduce((s, a) => s + a.limit, 0);
  const totalPct = Math.round((totalSpent / totalLimit) * 100);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg font-semibold text-gray-200">Budget & Cost</h1>
        {!liveMode && (
          <span className="badge-pending">⏳ PREVIEW — live data requires billing API keys</span>
        )}
      </div>

      {/* Company total */}
      <div className="card mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Company Total — April 2026</div>
            <div className="text-3xl font-bold text-gray-100">${totalSpent.toFixed(2)}</div>
            <div className="text-sm text-gray-500">of ${totalLimit.toFixed(0)} monthly budget</div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${totalPct >= 75 ? 'text-yellow-400' : 'text-green-400'}`}>
              {totalPct}%
            </div>
            <div className="text-xs text-gray-500">used</div>
          </div>
        </div>
        <ProgressBar pct={totalPct} />
      </div>

      {/* Per-agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {MOCK_AGENTS.map((agent) => {
          const pct = Math.round((agent.spent / agent.limit) * 100);
          const daily = DAILY_MOCK[agent.id] ?? [];
          const todaySpend = daily[daily.length - 1] ?? 0;
          const sparkColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-400' : 'bg-brand-500';

          return (
            <div key={agent.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-100">{agent.name}</div>
                  <div className="text-xs text-gray-500">{agent.role}</div>
                </div>
                <div className={`text-lg font-bold ${pct >= 90 ? 'text-red-400' : pct >= 75 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {pct}%
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>${agent.spent.toFixed(2)} spent</span>
                  <span>${agent.limit} limit</span>
                </div>
                <ProgressBar pct={pct} />
              </div>

              <div className="text-xs text-gray-600 font-mono mb-2">{agent.model}</div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-gray-800 rounded px-2 py-1">
                  <div className="text-gray-500">Input tokens</div>
                  <div className="text-gray-300">{(agent.inputTokens / 1_000_000).toFixed(1)}M</div>
                </div>
                <div className="bg-gray-800 rounded px-2 py-1">
                  <div className="text-gray-500">Output tokens</div>
                  <div className="text-gray-300">{(agent.outputTokens / 1_000_000).toFixed(1)}M</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>14-day burn</span>
                  <span>${todaySpend.toFixed(2)} today</span>
                </div>
                <Sparkline data={daily} color={sparkColor} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily burn table */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Daily Burn Rate — Last 7 Days</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Agent</th>
                {['Apr 9','Apr 10','Apr 11','Apr 12','Apr 13','Apr 14','Apr 15'].map((d) => (
                  <th key={d} className="text-right py-2 px-2">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_AGENTS.map((agent) => {
                const days = (DAILY_MOCK[agent.id] ?? []).slice(-7);
                return (
                  <tr key={agent.id} className="border-b border-gray-800/50">
                    <td className="py-2 pr-4 text-gray-300">{agent.name}</td>
                    {days.map((v, i) => (
                      <td key={i} className="text-right py-2 px-2 text-gray-400 font-mono text-xs">
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
