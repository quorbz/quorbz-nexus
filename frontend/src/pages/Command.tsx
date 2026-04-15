import { useState } from 'react';
import { AGENTS, ACTIVE_AGENTS, VENTURE_META, type VentureKey } from '../lib/roster';
import AgentCard from '../components/AgentCard';
import OrgChart from '../components/OrgChart';

type View = 'grid' | 'orgchart';

const VENTURE_GROUPS: { key: VentureKey | 'ownership'; label: string }[] = [
  { key: 'ownership', label: 'Ownership' },
  { key: 'v1',        label: 'Venture 1 — Digital Products' },
  { key: 'v2',        label: 'Venture 2 — SaaS' },
  { key: 'v3',        label: 'Venture 3 — Family Dashboard' },
  { key: 'v4',        label: 'Venture 4 — PaaS' },
  { key: 'finance',   label: "Leo's Finance & Legal" },
];

export default function CommandPage() {
  const [view, setView] = useState<View>('grid');
  const [showFuture, setShowFuture] = useState(true);

  const displayAgents = showFuture ? AGENTS : ACTIVE_AGENTS;
  const onlineCount = ACTIVE_AGENTS.filter((a) => a.status === 'online').length;
  const totalActive = ACTIVE_AGENTS.length;

  return (
    <div>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Agent Command</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {onlineCount}/{totalActive} active agents online · {AGENTS.length - totalActive} future agents planned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFuture(!showFuture)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              color: showFuture ? '#93c5fd' : 'var(--text-muted)',
              background: showFuture ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showFuture ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {showFuture ? 'Showing all 24' : 'Active only'}
          </button>
          {(['grid', 'orgchart'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors capitalize"
              style={{
                color: view === v ? '#93c5fd' : 'var(--text-muted)',
                background: view === v ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${view === v ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {v === 'orgchart' ? 'Org Chart' : 'Grid'}
            </button>
          ))}
        </div>
      </div>

      {view === 'orgchart' ? (
        <div className="card" style={{ overflowX: 'auto' }}>
          <div className="section-label mb-6">Full Org Hierarchy — {AGENTS.length} Agents · 4 Ventures</div>
          <OrgChart />
          <div className="mt-6 pt-4 flex flex-wrap gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {Object.entries(VENTURE_META).map(([key, vm]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: vm.color }} />
                {vm.label}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {VENTURE_GROUPS.map(({ key, label }) => {
            const group = displayAgents.filter((a) =>
              key === 'ownership' ? a.hierarchyLevel <= 2 && a.venture === 'ownership' :
              a.venture === key
            );
            if (group.length === 0) return null;
            const vm = VENTURE_META[key as VentureKey] ?? VENTURE_META.ownership;

            return (
              <div key={key}>
                <div className="section-label mb-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: vm.color, boxShadow: `0 0 6px ${vm.color}` }} />
                  {label}
                  <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                    ({group.filter((a) => a.isActive).length} active
                    {group.some((a) => !a.isActive) ? ` · ${group.filter((a) => !a.isActive).length} planned` : ''})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {group.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
