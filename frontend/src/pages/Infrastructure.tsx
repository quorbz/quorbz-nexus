// ── Mock vitals — replace with live Grafana iframe once deployed on DL380 ────
const MOCK_MACHINES = [
  { id: 'agent-nico',  name: 'Nico',  machine: 'Mac Studio M4 Max', os: 'macOS 15.2',  ip: '192.168.50.10',  cpu: 18,  ram: 42,  disk: 31,  temp: 44, uptime: '12d 4h', nanoclaw: true  },
  { id: 'agent-elena', name: 'Elena', machine: 'DL360',             os: 'Ubuntu 24.04', ip: '192.168.50.43',  cpu: 34,  ram: 61,  disk: 48,  temp: 52, uptime: '8d 17h', nanoclaw: true  },
  { id: 'agent-leo',   name: 'Leo',   machine: 'DL380',             os: 'Ubuntu 24.04', ip: '192.168.50.112', cpu: 22,  ram: 55,  disk: 62,  temp: 49, uptime: '8d 17h', nanoclaw: true  },
  { id: 'agent-mila',  name: 'Mila',  machine: 'Mac Studio M4 Max', os: 'macOS 15.2',  ip: '192.168.50.11',  cpu: 51,  ram: 73,  disk: 28,  temp: 58, uptime: '6d 2h',  nanoclaw: true  },
  { id: 'agent-marco', name: 'Marco', machine: 'Mac Mini M4 24GB',  os: 'macOS 15.2',  ip: '192.168.50.12',  cpu: 9,   ram: 38,  disk: 44,  temp: 39, uptime: '6d 2h',  nanoclaw: false },
  { id: 'agent-maya',  name: 'Maya',  machine: 'Mac Mini M4',       os: 'macOS 15.2',  ip: '192.168.50.13',  cpu: 27,  ram: 49,  disk: 36,  temp: 41, uptime: '6d 2h',  nanoclaw: true  },
];

function MiniBar({ value, warn = 75, danger = 90 }: { value: number; warn?: number; danger?: number }) {
  const color = value >= danger ? 'bg-red-500' : value >= warn ? 'bg-yellow-400' : 'bg-brand-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-400 w-8 text-right">{value}%</span>
    </div>
  );
}

export default function InfrastructurePage() {
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL ?? '';

  if (grafanaUrl) {
    return (
      <div className="h-full">
        <h1 className="text-lg font-semibold text-gray-200 mb-4">Infrastructure</h1>
        <iframe
          src={grafanaUrl}
          className="w-full rounded border border-gray-800"
          style={{ height: 'calc(100vh - 160px)' }}
          title="Grafana Dashboards"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg font-semibold text-gray-200">Infrastructure</h1>
        <span className="badge-pending">⏳ PREVIEW — Grafana deploys to DL380 with Stage 2</span>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Once Grafana is deployed on DL380, this tab becomes a live embedded dashboard.
        The layout below shows exactly what will be here.
      </p>

      {/* Machine grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {MOCK_MACHINES.map((m) => (
          <div key={m.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-100">{m.name}</div>
                <div className="text-xs text-gray-500">{m.machine}</div>
                <div className="text-xs text-gray-600 font-mono">{m.ip}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{m.os}</div>
                <div className="text-xs text-gray-600">Up {m.uptime}</div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">CPU</div>
                <MiniBar value={m.cpu} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">RAM</div>
                <MiniBar value={m.ram} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Disk</div>
                <MiniBar value={m.disk} warn={80} danger={90} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-500">
                Temp: <span className={m.temp > 70 ? 'text-red-400' : m.temp > 55 ? 'text-yellow-400' : 'text-gray-300'}>
                  {m.temp}°C
                </span>
              </div>
              <div className={`flex items-center gap-1 ${m.nanoclaw ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${m.nanoclaw ? 'bg-green-400' : 'bg-red-500'}`} />
                NanoClaw {m.nanoclaw ? 'running' : 'down'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nextcloud */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Nextcloud — DL380 (52TB)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Storage Used</div>
            <div className="text-gray-200 font-medium">8.4 TB</div>
            <MiniBar value={16} warn={70} danger={85} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Sync Status</div>
            <div className="text-green-400 font-medium">✓ Healthy</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Last Backup</div>
            <div className="text-gray-300">Apr 15, 03:00</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Service</div>
            <div className="text-green-400">Online</div>
          </div>
        </div>
      </div>

      {/* What Stage 2 adds */}
      <div className="card border-dashed border-gray-700">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Added in Stage 2 (Grafana)</h2>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Live time-series charts per machine (not just current values)</div>
          <div>• Historical CPU/RAM/disk trends — last 24h, 7d, 30d</div>
          <div>• Network traffic inbound/outbound per machine</div>
          <div>• Cost per model type — Sonnet vs Grok burn comparison</div>
          <div>• Token usage rate and cache hit rate</div>
          <div>• Uptime SLA tracker — 99.5% target per agent</div>
          <div>• Anomaly alerts — spike detection across all metrics</div>
        </div>
      </div>
    </div>
  );
}
