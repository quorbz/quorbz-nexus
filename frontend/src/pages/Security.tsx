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

// ── Mock network state — replace with live API data ────────────────────────
const MOCK_WG_CLIENTS = [
  { name: 'Benjamin (iPhone)',    ip: '10.0.0.2', lastHandshake: '2 min ago',  status: 'connected'    },
  { name: 'Benjamin (MacBook)',   ip: '10.0.0.3', lastHandshake: '14 min ago', status: 'connected'    },
  { name: 'Elena (DL360)',        ip: '10.0.0.5', lastHandshake: '1 min ago',  status: 'connected'    },
  { name: 'Leo (DL380)',          ip: '10.0.0.6', lastHandshake: '1 min ago',  status: 'connected'    },
];

const MOCK_CRED_ROTATION = [
  { name: 'XAI_API_KEY (Elena)',      lastRotated: '2026-04-07', daysAgo: 8,  status: 'ok'      },
  { name: 'TELEGRAM_BOT_TOKEN',       lastRotated: '2026-03-15', daysAgo: 31, status: 'warn'    },
  { name: 'ANTHROPIC_API_KEY (Nico)', lastRotated: '2026-04-01', daysAgo: 14, status: 'ok'      },
  { name: 'ONECLI_VAULT_TOKEN',       lastRotated: '2026-02-01', daysAgo: 73, status: 'overdue' },
];

const SEVERITY_COLORS: Record<string, string> = {
  low:      'text-gray-400 bg-gray-800 border-gray-700',
  medium:   'text-yellow-400 bg-yellow-900/20 border-yellow-800/40',
  high:     'text-orange-400 bg-orange-900/20 border-orange-800/40',
  critical: 'text-red-400 bg-red-900/20 border-red-800/40',
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
    const inc = await api.get<Incident[]>('/security/incidents?acknowledged=false');
    setIncidents(inc);
    setLoading(false);
  }

  async function acknowledge(id: string) {
    await api.patch(`/security/incidents/${id}/acknowledge`, {});
    load();
  }

  useEffect(() => { load(); }, []);

  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-200 mb-6">Security / Network</h1>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-gray-600'}`}>
            {criticalCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Critical</div>
        </div>
        <div className="card text-center">
          <div className={`text-2xl font-bold ${highCount > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
            {highCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">High</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">6/6</div>
          <div className="text-xs text-gray-500 mt-1">Machines Reachable</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">4</div>
          <div className="text-xs text-gray-500 mt-1">VPN Clients Online</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* WireGuard VPN */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">WireGuard VPN</h2>
            <span className="badge-pending text-xs">⏳ Live data — Stage 3</span>
          </div>
          <div className="space-y-2">
            {MOCK_WG_CLIENTS.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-gray-200">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-mono">{c.ip}</span>
                  <span>{c.lastHandshake}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Firewall posture */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Firewall Posture</h2>
            <span className="badge-pending text-xs">⏳ Live data — Stage 3</span>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { machine: 'Elena (DL360)',        status: 'Compliant',     ok: true  },
              { machine: 'Leo (DL380)',           status: 'Compliant',     ok: true  },
              { machine: 'Nico (Mac Studio)',     status: 'Compliant',     ok: true  },
              { machine: 'Mila (Mac Studio)',     status: 'Not verified',  ok: false },
              { machine: 'Marco (Mac Mini)',      status: 'Not verified',  ok: false },
              { machine: 'Maya (Mac Mini)',       status: 'Not verified',  ok: false },
            ].map((row) => (
              <div key={row.machine} className="flex items-center justify-between">
                <span className="text-gray-300">{row.machine}</span>
                <span className={row.ok ? 'text-green-400 text-xs' : 'text-yellow-400 text-xs'}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-600 mt-3">
            "Not verified" = SSH access not yet established. Resolves when machine keys are loaded.
          </div>
        </div>
      </div>

      {/* Credential rotation tracker */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Credential Rotation</h2>
        <div className="space-y-2">
          {MOCK_CRED_ROTATION.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <div className="text-gray-300">{c.name}</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{c.daysAgo}d ago</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  c.status === 'ok'      ? 'bg-green-900/30 text-green-400' :
                  c.status === 'warn'    ? 'bg-yellow-900/30 text-yellow-400' :
                                           'bg-red-900/30 text-red-400'
                }`}>
                  {c.status === 'ok' ? '✓ Current' : c.status === 'warn' ? '⚠ Rotate Soon' : '✗ Overdue'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live incident log */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Open Incidents
          {incidents.length > 0 && <span className="ml-2 text-red-400">({incidents.length})</span>}
        </h2>

        {loading ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : incidents.length === 0 ? (
          <div className="text-sm text-gray-600">No open incidents — all clear</div>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className={`rounded p-3 border text-sm ${SEVERITY_COLORS[inc.severity] ?? ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium uppercase">{inc.severity}</span>
                      <span className="text-xs text-gray-500">{TYPE_LABELS[inc.type] ?? inc.type}</span>
                      <span className="text-xs text-gray-600">{inc.source}</span>
                    </div>
                    <div className="text-gray-200">{inc.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(inc.createdAt).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => acknowledge(inc.id)}
                    className="text-xs text-gray-500 hover:text-gray-300 whitespace-nowrap border border-gray-700 rounded px-2 py-0.5"
                  >
                    Ack
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>• SSH fail counter, outbound anomaly detector, file integrity monitoring → Stage 3</div>
            <div>• One-click agent isolation → Stage 3</div>
            <div>• Loki log search → Stage 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
