import { AGENTS, VENTURE_META, type Agent, type VentureKey } from '../lib/roster';

const VENTURE_ORDER: VentureKey[] = ['v1', 'v2', 'v3', 'v4', 'finance'];

function AgentNode({ agent, isLead = false }: { agent: Agent; isLead?: boolean }) {
  const vm = VENTURE_META[agent.venture];
  const isLive = agent.isActive;

  return (
    <div
      className="flex flex-col items-center"
      style={{ minWidth: isLead ? '100px' : '88px' }}
    >
      {/* Avatar circle */}
      <div
        className="flex items-center justify-center rounded-full font-bold text-sm transition-all relative"
        style={{
          width: isLead ? '48px' : '40px',
          height: isLead ? '48px' : '40px',
          background: isLive
            ? `linear-gradient(135deg, ${vm.color}33 0%, ${vm.color}1a 100%)`
            : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${isLive ? vm.color + '60' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isLive ? `0 0 12px ${vm.color}30` : 'none',
          color: isLive ? vm.accent : '#475569',
          opacity: isLive ? 1 : 0.5,
        }}
      >
        {agent.name[0]}
        {/* Status dot */}
        {isLive && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full status-dot ${agent.status}`}
            style={{ border: '2px solid var(--bg-base)' }}
          />
        )}
      </div>
      <div className="mt-1.5 text-center">
        <div className="text-xs font-medium" style={{ color: isLive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {agent.name}
        </div>
        <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
          {agent.role.split(' ')[0]}
        </div>
        {!isLive && (
          <div className="text-xs" style={{ color: '#334155', fontSize: '9px' }}>future</div>
        )}
      </div>
    </div>
  );
}

function ConnectorLine({ color }: { color: string }) {
  return (
    <div
      className="w-px mx-auto"
      style={{ height: '20px', background: `linear-gradient(to bottom, ${color}50, ${color}20)` }}
    />
  );
}

function HorizConnector({ color, width }: { color: string; width: string }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: `linear-gradient(to right, transparent, ${color}40, transparent)`, width }}
    />
  );
}

export default function OrgChart() {
  const ownership = AGENTS.filter((a) => a.hierarchyLevel === 1);
  const executive = AGENTS.filter((a) => a.hierarchyLevel === 2);
  const leads = AGENTS.filter((a) => a.hierarchyLevel === 3);
  const contributors = AGENTS.filter((a) => a.hierarchyLevel === 4);

  const ventureCols = VENTURE_ORDER.map((v) => ({
    venture: v,
    lead: leads.find((l) => l.venture === v),
    team: contributors.filter((c) => c.venture === v),
    meta: VENTURE_META[v],
  }));

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-max mx-auto" style={{ padding: '0 24px' }}>

        {/* Level 1: Ownership */}
        <div className="section-label mb-4">Ownership Layer</div>
        <div className="flex justify-center gap-12 mb-2">
          {ownership.map((a) => <AgentNode key={a.id} agent={a} />)}
        </div>

        {/* Connector from Nico/Leo down to Level 2 */}
        <div className="flex justify-center">
          <ConnectorLine color="#6366f1" />
        </div>

        {/* Level 2: Executive */}
        <div className="flex justify-center gap-8 mb-2">
          {executive.map((a) => <AgentNode key={a.id} agent={a} />)}
        </div>

        {/* Connector down to leads */}
        <div className="flex justify-center">
          <ConnectorLine color="#3b82f6" />
        </div>

        {/* Horizontal span line */}
        <div
          className="mx-auto mb-2"
          style={{
            height: '1px',
            width: `${ventureCols.length * 160}px`,
            background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.3), rgba(139,92,246,0.3), rgba(6,182,212,0.3), rgba(16,185,129,0.3), rgba(245,158,11,0.3), transparent)',
          }}
        />

        {/* Level 3 + 4: Venture columns */}
        <div className="flex gap-4 justify-center">
          {ventureCols.map(({ venture, lead, team, meta }) => (
            <div key={venture} className="flex flex-col items-center" style={{ minWidth: '120px' }}>
              {/* Connector from span down to lead */}
              <ConnectorLine color={meta.color} />

              {/* Lead node */}
              <div className="relative mb-2">
                {lead ? <AgentNode agent={lead} isLead /> : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xs"
                    style={{ border: `1.5px dashed ${meta.color}30`, color: '#334155' }}
                  >
                    TBD
                  </div>
                )}
              </div>

              {/* Venture badge */}
              <div className="mb-3">
                <span className={`badge-venture ${meta.badgeClass}`} style={{ fontSize: '9px' }}>
                  {venture === 'finance' ? "Leo's Finance" : venture.toUpperCase()}
                </span>
              </div>

              {/* Connector to team */}
              <ConnectorLine color={meta.color} />

              {/* Team nodes */}
              <div className="flex flex-col gap-2">
                {team.map((a) => <AgentNode key={a.id} agent={a} />)}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
