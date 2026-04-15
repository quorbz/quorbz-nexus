import { VENTURE_META } from '../lib/roster';

const PIPELINE_STAGES = [
  { key: 'research',          label: 'Research',          color: '#475569' },
  { key: 'leo_precheck',      label: 'Leo Pre-check',     color: '#7c3aed' },
  { key: 'build',             label: 'Build',             color: '#1d4ed8' },
  { key: 'copy',              label: 'Copy',              color: '#0891b2' },
  { key: 'leo_final',         label: 'Leo Final',         color: '#6d28d9' },
  { key: 'benjamin_approval', label: 'Benjamin Approval', color: '#1e40af' },
  { key: 'publish',           label: 'Publish',           color: '#065f46' },
];

const MOCK_PIPELINE = [
  { id: '1', title: 'Digital Planner Templates x20', venture: 'v1', stage: 'build',    status: 'active' },
  { id: '2', title: 'Minimalist Wall Art Bundle',    venture: 'v1', stage: 'copy',     status: 'active' },
  { id: '3', title: 'Social Media Kit — Q2',        venture: 'v1', stage: 'research', status: 'active' },
  { id: '4', title: 'AI Content Repurposer MVP',    venture: 'v2', stage: 'research', status: 'blocked', blockReason: 'Awaiting V1 revenue milestone' },
];

const MOCK_TASKS = [
  { id: '1', title: 'Build Quorbz Nexus Stage 1',             agentName: 'Nico',  status: 'complete',    venture: null },
  { id: '2', title: 'Coordinate V1 product pipeline',          agentName: 'Elena', status: 'in_progress', venture: 'v1' },
  { id: '3', title: 'Review compliance framework for products', agentName: 'Leo',   status: 'in_progress', venture: 'v1' },
  { id: '4', title: 'Generate 20 Etsy listing assets',         agentName: 'Mila',  status: 'in_progress', venture: 'v1' },
  { id: '5', title: 'Write copy for 5 product listings',       agentName: 'Maya',  status: 'in_progress', venture: 'v1' },
  { id: '6', title: 'NanoClaw process down — investigate',     agentName: 'Marco', status: 'blocked',     venture: null,  blockReason: 'NanoClaw not responding' },
];

const STATUS_PILL: Record<string, { label: string; style: React.CSSProperties }> = {
  assigned:    { label: 'Assigned',    style: { background: 'rgba(71,85,105,0.3)', color: '#94a3b8', border: '1px solid rgba(71,85,105,0.4)' } },
  in_progress: { label: 'In Progress', style: { background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' } },
  blocked:     { label: 'Blocked',     style: { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' } },
  review:      { label: 'Review',      style: { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' } },
  complete:    { label: 'Complete',    style: { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' } },
};

export default function PipelinePage() {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Pipeline</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Product pipeline across all ventures · Elena orchestrates · Leo reviews at two checkpoints
      </p>

      {/* Product pipeline */}
      <section className="mb-8">
        <div className="section-label mb-4">Elena's Product Pipeline</div>

        {/* Stage columns */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)`, gap: '8px', marginBottom: '16px' }}>
          {PIPELINE_STAGES.map((stage) => {
            const items = MOCK_PIPELINE.filter((i) => i.stage === stage.key);
            return (
              <div key={stage.key} className="card" style={{ minHeight: '100px', padding: '12px' }}>
                <div
                  className="text-xs font-semibold mb-2 px-2 py-0.5 rounded-md inline-block"
                  style={{ background: stage.color + '33', color: stage.color === '#475569' ? '#94a3b8' : '#e2e8f0', border: `1px solid ${stage.color}44`, fontSize: '10px' }}
                >
                  {stage.label}
                </div>
                {items.length === 0 ? (
                  <div className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>—</div>
                ) : (
                  <div className="space-y-1">
                    {items.map((item) => {
                      const vm = VENTURE_META[item.venture as keyof typeof VENTURE_META];
                      return (
                        <div
                          key={item.id}
                          className="rounded-lg p-1.5"
                          style={{
                            background: item.status === 'blocked'
                              ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${item.status === 'blocked' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`,
                          }}
                        >
                          <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)', fontSize: '11px' }}>
                            {item.title}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`badge-venture badge-${item.venture}`} style={{ fontSize: '9px' }}>
                              {item.venture.toUpperCase()}
                            </span>
                            {item.status === 'blocked' && (
                              <span style={{ fontSize: '9px', color: '#f87171' }}>blocked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cross-venture bridge note */}
        <div className="card" style={{ padding: '12px 16px', background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.15)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: '#c4b5fd' }}>Cross-Venture Bridge Model</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Every product routes through Leo's team twice (leo_precheck → leo_final). Maya publishes for all ventures — tasks cross team boundaries, agents don't duplicate. Elena's leads manage the routing.
          </div>
        </div>
      </section>

      {/* Task board */}
      <section>
        <div className="section-label mb-4">Task Board</div>
        <div className="space-y-2">
          {MOCK_TASKS.map((task) => {
            const pill = STATUS_PILL[task.status] ?? STATUS_PILL.assigned;
            const vm = task.venture ? VENTURE_META[task.venture as keyof typeof VENTURE_META] : null;
            return (
              <div key={task.id} className="card flex items-center gap-4" style={{ padding: '10px 14px' }}>
                <span className="text-xs font-medium px-2 py-0.5 rounded-lg whitespace-nowrap" style={pill.style}>
                  {pill.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                  {task.blockReason && (
                    <div className="text-xs" style={{ color: '#f87171' }}>🚫 {task.blockReason}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {vm && <span className={`badge-venture badge-${task.venture}`} style={{ fontSize: '10px' }}>{task.venture?.toUpperCase()}</span>}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.agentName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
