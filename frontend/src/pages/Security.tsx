import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Incident {
  id: string;
  agentId: string | null;
  type: string;
  severity: string;
  description: string;
  source: string;
  acknowledged: boolean;
  createdAt: string;
}

const MOCK_WG_CLIENTS = [
  { name: 'Benjamin (iPhone)',  ip: '10.0.0.2', lastHandshake: '2 min ago',  status: 'connected' },
  { name: 'Benjamin (MacBook)', ip: '10.0.0.3', lastHandshake: '14 min ago', status: 'connected' },
  { name: 'Elena (DL360)',      ip: '10.0.0.5', lastHandshake: '1 min ago',  status: 'connected' },
  { name: 'Leo (DL380)',        ip: '10.0.0.6', lastHandshake: '1 min ago',  status: 'connected' },
];

const MOCK_CRED_ROTATION = [
  { name: 'XAI_API_KEY (Elena)',      lastRotated: '2026-04-07', daysAgo: 8,  status: 'ok'      },
  { name: 'TELEGRAM_BOT_TOKEN',       lastRotated: '2026-03-15', daysAgo: 31, status: 'warn'    },
  { name: 'ANTHROPIC_API_KEY (Nico)', lastRotated: '2026-04-01', daysAgo: 14, status: 'ok'      },
  { name: 'ONECLI_VAULT_TOKEN',       lastRotated: '2026-02-01', daysAgo: 73, status: 'overdue' },
];

const FIREWALL_ROWS = [
  { machine: 'Nico (Mac Studio)',  status: 'Compliant',    ok: true  },
  { machine: 'Elena (DL360)',      status: 'Compliant',    ok: true  },
  { machine: 'Leo (DL380)',        status: 'Compliant',    ok: true  },
  { machine: 'Mila (Mac Studio)',  status: 'Not verified', ok: false },
  { machine: 'Marco (Mac Mini)',   status: 'Not verified', ok: false },
  { machine: 'Maya (Mac Mini)',    status: 'Not verified', ok: false },
];

const SEVERITY_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  low:      { bg: 'rgba(71,85,105,0.2)',   border: 'rgba(71,85,105,0.3)',   color: '#94a3b8' },
  medium:   { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: '#fbbf24' },
  high:     { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', color: '#fb923c' },
  critical: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  color: '#f87171' },
};

const TYPE_LABELS: Record<string, string> = {
  ssh_fail:         'SSH Fail',
  outbound_anomaly: 'Outbound Anomaly',
  file_modified:    'File Modified',
  port_scan:        'Port Scan',
  process_anomaly:  'Process Anomaly',
  login_attempt:    'Login Attempt',
};

export default function SecurityPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const inc = await api.get<Incident[]>('/security/incidents?acknowledged=false');
      setIncidents(inc);
    } catch {
      setIncidents([]);
    }
    setLoading(false);
  }

  async function acknowledge(id: string) {
    await api.patch(`/security/incidents/${id}/acknowledge`, {});
    load();
  }

  useEffect(() => { load(); }, []);

  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount     = incidents.filter((i) => i.severity === 'high').length;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Security / Network</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Zero-trust posture · WireGuard VPN · Credential rotation · Incident log
      </p>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Critical', value: String(criticalCount), color: criticalCount > 0 ? '#f87171' : '#475569' },
          { label: 'High',     value: String(highCount),     color: highCount > 0 ? '#fb923c' : '#475569'     },
          { label: 'Machines Reachable', value: '3/6', color: '#f59e0b' },
          { label: 'VPN Clients',        value: '4',   color: '#34d399' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center" style={{ padding: '16px' }}>
            <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* WireGuard VPN */}
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="section-label">WireGuard VPN</div>
            <span className="badge-pending text-xs">⏳ Live — Stage 3</span>
          </div>
          <div className="space-y-2.5">
            {MOCK_WG_CLIENTS.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-mono">{c.ip}</span>
                  <span>{c.lastHandshake}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Firewall posture */}
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="section-label">Firewall Posture</div>
            <span className="badge-pending text-xs">⏳ Live — Stage 3</span>
          </div>
          <div className="space-y-2">
            {FIREWALL_ROWS.map((row) => (
              <div key={row.machine} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{row.machine}</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={row.ok
                    ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                    : { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }
                  }
                >
                  {row.status}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs mt-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Not verified = SSH access not yet established. Resolves when machine keys are loaded.
          </div>
        </div>
      </div>

      {/* Credential rotation */}
      <div className="card mb-6" style={{ padding: '16px 20px' }}>
        <div className="section-label mb-4">Credential Rotation</div>
        <div className="space-y-2.5">
          {MOCK_CRED_ROTATION.map((c) => (
            <div key={c.name} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.daysAgo}d ago</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={
                    c.status === 'ok'      ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' } :
                    c.status === 'warn'    ? { background: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)'  } :
                                             { background: 'rgba(239,68,68,0.1)',   color: '#f87171', border: '1px solid rgba(239,68,68,0.2)'   }
                  }
                >
                  {c.status === 'ok' ? '✓ Current' : c.status === 'warn' ? '⚠ Rotate Soon' : '✗ Overdue'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident log */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="section-label mb-4">
          Open Incidents
          {incidents.length > 0 && <span style={{ color: '#f87171', marginLeft: '6px' }}>({incidents.length})</span>}
        </div>

        {loading ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
        ) : incidents.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No open incidents — all clear</div>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc) => {
              const sty = SEVERITY_STYLE[inc.severity] ?? SEVERITY_STYLE.low;
              return (
                <div
                  key={inc.id}
                  className="rounded-lg p-3"
                  style={{ background: sty.bg, border: `1px solid ${sty.border}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium uppercase" style={{ color: sty.color }}>{inc.severity}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[inc.type] ?? inc.type}</span>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{inc.source}</span>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{inc.description}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {new Date(inc.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => acknowledge(inc.id)}
                      className="text-xs whitespace-nowrap rounded-lg px-2 py-0.5 transition-colors"
                      style={{ color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
                    >
                      Ack
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 text-xs space-y-0.5" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', opacity: 0.7 }}>
          <div>• SSH fail counter, outbound anomaly detector, file integrity monitoring → Stage 3</div>
          <div>• One-click agent isolation → Stage 3</div>
          <div>• Loki log search → Stage 3</div>
        </div>
      </div>
    </div>
  );
}
