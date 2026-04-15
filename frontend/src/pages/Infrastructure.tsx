export default function InfrastructurePage() {
  // GRAFANA_URL will be set in env once Grafana is deployed on DL380
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL ?? '';

  return (
    <div className="h-full">
      <h1 className="text-lg font-semibold text-gray-200 mb-4">Infrastructure</h1>

      {!grafanaUrl ? (
        <div className="card">
          <div className="badge-pending mb-3">⏳ PENDING: Grafana deployment on DL380</div>
          <p className="text-sm text-gray-500 mb-4">
            Once Grafana is deployed on DL380 and <code className="text-gray-400">VITE_GRAFANA_URL</code> is set,
            this tab will embed live dashboards for all six agent machines — CPU, RAM, disk, network, temps, and NanoClaw process health.
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Prometheus + Node Exporter on every machine</div>
            <div>• Machine vitals (CPU, RAM, disk, network, temperatures)</div>
            <div>• NanoClaw process health per agent</div>
            <div>• Uptime SLA — 99.5% target per agent</div>
            <div>• Cost per model type (Sonnet vs Grok burn rate)</div>
          </div>
        </div>
      ) : (
        <iframe
          src={grafanaUrl}
          className="w-full rounded border border-gray-800"
          style={{ height: 'calc(100vh - 160px)' }}
          title="Grafana Dashboards"
        />
      )}
    </div>
  );
}
