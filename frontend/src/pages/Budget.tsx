export default function BudgetPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-200 mb-2">Budget & Cost</h1>
      <div className="badge-pending mb-6">⏳ PENDING: Anthropic billing API key + xAI billing API key required for live cost data</div>
      <p className="text-sm text-gray-500 mb-6">
        Once billing API keys are provided, this tab will show real-time cost per agent, daily burn, monthly totals, and budget alerts.
        Manual cost entries can be added via the API in the meantime.
      </p>

      {/* Placeholder layout showing what will be here */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 opacity-40 pointer-events-none select-none">
        {['Nico', 'Elena', 'Leo', 'Mila', 'Marco', 'Maya'].map((name) => (
          <div key={name} className="card">
            <div className="font-semibold text-gray-200 mb-1">{name}</div>
            <div className="text-2xl font-bold text-gray-400">$—</div>
            <div className="text-xs text-gray-600 mb-2">/ $— this month</div>
            <div className="h-1.5 bg-gray-700 rounded-full">
              <div className="h-full bg-brand-700 rounded-full w-1/3" />
            </div>
            <div className="text-xs text-gray-600 mt-1">0% of budget</div>
          </div>
        ))}
      </div>

      <div className="card opacity-40 pointer-events-none select-none">
        <div className="text-sm font-semibold text-gray-400 mb-2">Company Total</div>
        <div className="text-3xl font-bold text-gray-300">$—</div>
        <div className="text-xs text-gray-600">across all 6 agents this month</div>
      </div>
    </div>
  );
}
