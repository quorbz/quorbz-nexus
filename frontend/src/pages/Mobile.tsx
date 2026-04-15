/**
 * Mobile lite controls — /mobile
 * Unauthenticated mockup for design review.
 * Will require auth in production.
 */
import { ACTIVE_AGENTS } from '../lib/roster';

const PENDING_APPROVALS = [
  { id: 1, title: 'V1 Product Package — 5 Etsy listings', from: 'Elena → Benjamin', time: '12m ago', type: 'approve' },
  { id: 2, title: 'Deploy NanoClaw to Elena machine', from: 'Nico → Benjamin', time: '1h ago', type: 'approve' },
];

const RECENT_ALERTS = [
  { id: 1, text: 'Marco: NanoClaw process down', severity: 'high', time: '8m ago' },
  { id: 2, text: 'Budget: Mila at 56% monthly limit', severity: 'medium', time: '2h ago' },
];

const VENTURE_PROGRESS = [
  { label: 'V1 Pipeline', value: 40, color: '#3b82f6' },
  { label: 'V2 Stage A',  value: 0,  color: '#8b5cf6' },
  { label: 'V3 Planned',  value: 0,  color: '#06b6d4' },
  { label: 'V4 Planned',  value: 0,  color: '#10b981' },
];

export default function MobilePage() {
  const onlineCount = ACTIVE_AGENTS.filter((a) => a.status === 'online').length;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Phone frame */}
      <div
        className="relative"
        style={{
          width: '375px',
          borderRadius: '44px',
          border: '8px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
          background: 'var(--bg-base)',
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-6 pt-3 pb-2"
          style={{ background: 'var(--bg-surface)', fontSize: '12px', color: 'var(--text-muted)' }}
        >
          <span className="font-semibold">9:41</span>
          <div className="w-24 h-4 rounded-full" style={{ background: 'rgba(0,0,0,0.8)', margin: '0 auto' }} />
          <span>100%</span>
        </div>

        {/* App header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 10px rgba(59,130,246,0.4)' }}
            >
              Q
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nexus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
            <span style={{ fontSize: '11px', color: '#34d399' }}>{onlineCount} online</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto" style={{ maxHeight: '720px', padding: '16px' }}>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Agents', value: `${onlineCount}/${ACTIVE_AGENTS.length}`, color: '#34d399' },
              { label: 'Blockers', value: '0', color: '#94a3b8' },
              { label: 'Spend', value: '$2.87', color: '#94a3b8' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card text-center" style={{ padding: '10px 8px' }}>
                <div className="text-base font-bold" style={{ color }}>{value}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Pending approvals */}
          {PENDING_APPROVALS.length > 0 && (
            <div className="mb-4">
              <div className="section-label text-xs mb-2">Needs Your Approval</div>
              <div className="space-y-2">
                {PENDING_APPROVALS.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.from} · {item.time}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                      >
                        Approve
                      </button>
                      <button
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {RECENT_ALERTS.length > 0 && (
            <div className="mb-4">
              <div className="section-label text-xs mb-2">Active Alerts</div>
              <div className="space-y-2">
                {RECENT_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2 rounded-xl p-3"
                    style={{
                      background: alert.severity === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                      border: `1px solid ${alert.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}
                  >
                    <span style={{ color: alert.severity === 'high' ? '#f87171' : '#fbbf24', fontSize: '14px' }}>
                      {alert.severity === 'high' ? '⚠' : '◉'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{alert.text}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{alert.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent status */}
          <div className="mb-4">
            <div className="section-label text-xs mb-2">Agent Status</div>
            <div className="space-y-1.5">
              {ACTIVE_AGENTS.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className={`status-dot ${a.status}`} />
                  <span className="text-xs font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{a.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{a.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Venture progress */}
          <div className="mb-4">
            <div className="section-label text-xs mb-2">Venture Progress</div>
            <div className="space-y-2">
              {VENTURE_PROGRESS.map((v) => (
                <div key={v.label}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{v.label}</span>
                    <span>{v.value > 0 ? `${v.value}%` : 'Planned'}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${v.value}%`,
                        background: `linear-gradient(90deg, ${v.color}99, ${v.color})`,
                        minWidth: v.value > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom nav */}
        <div
          className="grid grid-cols-4 px-2 py-2 pb-3"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {[
            { icon: '◎', label: 'Feed', active: true },
            { icon: '⬡', label: 'Command', active: false },
            { icon: '⇉', label: 'Pipeline', active: false },
            { icon: '◈', label: 'Budget', active: false },
          ].map(({ icon, label, active }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl"
              style={{
                color: active ? '#60a5fa' : 'var(--text-muted)',
                background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span style={{ fontSize: '9px', fontWeight: '500' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview label */}
      <div
        className="absolute bottom-8 left-0 right-0 text-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        Mobile Lite Controls — PWA preview · <span style={{ color: '#60a5fa' }}>quorbz-nexus/mobile</span>
      </div>
    </div>
  );
}
