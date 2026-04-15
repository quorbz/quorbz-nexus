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

interface Summary {
  severity: string;
  _count: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  low:      'text-gray-400 bg-gray-800',
  medium:   'text-yellow-400 bg-yellow-900/30',
  high:     'text-orange-400 bg-orange-900/30',
  critical: 'text-red-400 bg-red-900/30',
};

const TYPE_LABELS: Record<string, string> = {
  ssh_fail:          'SSH Fail',
  outbound_anomaly:  'Outbound Anomaly',
  file_modified:     'File Modified',
  port_scan:         'Port Scan',
  process_anomaly:   'Process Anomaly',
  login_attempt:     'Login Attempt',
};

export default function SecurityPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [inc, sum] = await Promise.all([
      api.get<Incident[]>('/security/incidents?acknowledged=false'),
      api.get<Summary[]>('/security/summary'),
    ]);
    setIncidents(inc);
    setSummary(sum);
    setLoading(false);
  }

  async function acknowledge(id: string) {
    await api.patch(`/security/incidents/${id}/acknowledge`, {});
    load();
  }

  if (loading) return <div className="text-gray-500 text-sm">Loading security data…</div>;

  const totalOpen = summary.reduce((n, s) => n + s._count, 0);

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-200 mb-6">Security / Network</h1>

      {/* Summary counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['critical', 'high', 'medium', 'low'].map((sev) => {
          const entry = summary.find((s) => s.severity === sev);
          return (
            <div key={sev} className="card text-center">
              <div className={`text-2xl font-bold ${entry?._count ? (sev === 'critical' || sev === 'high' ? 'text-red-400' : 'text-yellow-400') : 'text-gray-600'}`}>
                {entry?._count ?? 0}
              </div>
              <div className="text-xs text-gray-500 capitalize mt-1">{sev}</div>
            </div>
          );
        })}
      </div>

      {/* WireGuard placeholder */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Network</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">WireGuard VPN</div>
            <div className="badge-pending">⏳ PENDING: wg-monitor agent deployment</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Connected Clients</div>
            <div className="badge-pending">⏳ PENDING</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">DDNS Status</div>
            <div className="badge-pending">⏳ PENDING</div>
          </div>
        </div>
      </div>

      {/* Incident log */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Open Incidents
            {totalOpen > 0 && <span className="ml-2 text-red-400">({totalOpen})</span>}
          </h2>
        </div>

        {incidents.length === 0 ? (
          <div className="text-sm text-gray-600">No open incidents</div>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className={`rounded p-3 ${SEVERITY_COLORS[inc.severity] ?? ''} border border-gray-800`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium uppercase">{inc.severity}</span>
                      <span className="text-xs text-gray-500">{TYPE_LABELS[inc.type] ?? inc.type}</span>
                      <span className="text-xs text-gray-600">{inc.source}</span>
                    </div>
                    <div className="text-sm text-gray-200">{inc.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(inc.createdAt).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => acknowledge(inc.id)}
                    className="text-xs text-gray-500 hover:text-gray-300 whitespace-nowrap"
                  >
                    Ack
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credential rotation tracker placeholder */}
      <div className="card mt-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Credential Rotation</h2>
        <div className="badge-pending">⏳ PENDING: Credential rotation tracker — populate when keys are loaded into OneCLI vault</div>
      </div>
    </div>
  );
}
