export type AgentStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export interface HeartbeatPayload {
  agentId: string;
  status: AgentStatus;
  cpuPercent?: number;
  ramPercent?: number;
  diskPercent?: number;
  nanoclaw?: boolean;
  nodeVersion?: string;
  uptimeSecs?: number;
  extra?: Record<string, unknown>;
}

export interface WsMessage {
  type: 'heartbeat_update' | 'incident' | 'task_update' | 'pipeline_update' | 'synthesizer_entry';
  payload: unknown;
}

export interface AgentWithStatus {
  id: string;
  name: string;
  role: string;
  machine: string;
  ip: string;
  os: string;
  model: string;
  hierarchyLevel: number;
  reportsTo: string | null;
  venture: string | null;
  isActive: boolean;
  status: AgentStatus;
  lastHeartbeat: Date | null;
  currentTask: string | null;
}
