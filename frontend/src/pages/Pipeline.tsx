import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface PipelineItem {
  id: string;
  title: string;
  venture: string;
  currentStage: string;
  status: string;
  assignedLeadId: string | null;
  blockReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  assignedTo: { id: string; name: string; role: string };
  sourceVenture: string | null;
  blockReason: string | null;
  updatedAt: string;
}

const STAGES = [
  { key: 'research',           label: 'Research',          color: 'bg-gray-700' },
  { key: 'leo_precheck',       label: 'Leo Pre-check',     color: 'bg-purple-700' },
  { key: 'build',              label: 'Build',             color: 'bg-blue-700' },
  { key: 'copy',               label: 'Copy',              color: 'bg-cyan-700' },
  { key: 'leo_final',          label: 'Leo Final',         color: 'bg-purple-700' },
  { key: 'benjamin_approval',  label: 'Benjamin Approval', color: 'bg-brand-700' },
  { key: 'publish',            label: 'Publish',           color: 'bg-green-700' },
];

const STATUS_COLORS: Record<string, string> = {
  active:   'text-green-400',
  blocked:  'text-red-400',
  approved: 'text-brand-400',
  rejected: 'text-red-500',
  published:'text-green-300',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  assigned:    'bg-gray-700',
  in_progress: 'bg-brand-700',
  blocked:     'bg-red-800',
  review:      'bg-yellow-800',
  complete:    'bg-green-800',
};

export default function PipelinePage() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<PipelineItem[]>('/pipeline'),
      api.get<Task[]>('/tasks'),
    ]).then(([p, t]) => {
      setItems(p);
      setTasks(t);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-500 text-sm">Loading pipeline…</div>;

  const activeItems = items.filter((i) => i.status !== 'published');
  const published = items.filter((i) => i.status === 'published');

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-200 mb-6">Pipeline & Tasks</h1>

      {/* Product Pipeline */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Elena's Product Pipeline
          {activeItems.length > 0 && (
            <span className="ml-2 text-brand-400 normal-case tracking-normal">
              {activeItems.length} active
            </span>
          )}
        </h2>

        {/* Stage columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
          {STAGES.map((stage) => {
            const stageItems = activeItems.filter((i) => i.currentStage === stage.key);
            return (
              <div key={stage.key} className="card min-h-24">
                <div className={`text-xs font-semibold mb-2 px-1.5 py-0.5 rounded ${stage.color} text-white inline-block`}>
                  {stage.label}
                </div>
                {stageItems.length === 0 ? (
                  <div className="text-xs text-gray-700">—</div>
                ) : (
                  <div className="space-y-1">
                    {stageItems.map((item) => (
                      <div key={item.id} className="text-xs bg-gray-800 rounded p-1">
                        <div className={`font-medium ${STATUS_COLORS[item.status] ?? 'text-gray-300'} truncate`}>
                          {item.title}
                        </div>
                        <div className="text-gray-600">{item.venture}</div>
                        {item.blockReason && (
                          <div className="text-red-400 truncate">{item.blockReason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {published.length > 0 && (
          <div className="text-xs text-gray-500">{published.length} item(s) published</div>
        )}
      </section>

      {/* Task Board */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Task Board</h2>
        {tasks.length === 0 ? (
          <div className="text-sm text-gray-600">No tasks yet</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="card flex items-center gap-4">
                <span className={`text-xs px-2 py-0.5 rounded font-medium text-white ${TASK_STATUS_COLORS[task.status] ?? 'bg-gray-700'}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{task.title}</div>
                  {task.blockReason && (
                    <div className="text-xs text-red-400">🚫 {task.blockReason}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {task.assignedTo.name}
                </div>
                {task.sourceVenture && (
                  <div className="text-xs text-gray-600">{task.sourceVenture}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
