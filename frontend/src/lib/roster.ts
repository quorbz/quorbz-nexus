// ── Full Quorbz agent roster — year-10 scale (24 agents) ──────────────────
// This is the source of truth for mock data across all tabs.
// Populated from seed data once backend is live.

export type AgentStatus = 'online' | 'offline' | 'degraded' | 'unknown';
export type VentureKey = 'ownership' | 'v1' | 'v2' | 'v3' | 'v4' | 'finance';

export interface Agent {
  id: string;
  name: string;
  role: string;
  machine: string;
  ip: string;
  os: string;
  model: string;
  hierarchyLevel: number; // 0=founder 1=ownership 2=executive 3=lead 4=contributor
  reportsTo: string | null;
  venture: VentureKey;
  isActive: boolean;
  // Mock runtime state
  status: AgentStatus;
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
  nanoclaw: boolean;
  uptime: string;
  currentTask: string | null;
}

export const VENTURE_META: Record<VentureKey, { label: string; color: string; badgeClass: string; accent: string }> = {
  ownership: { label: 'Ownership',          color: '#6366f1', badgeClass: 'badge-own', accent: '#818cf8' },
  v1:        { label: 'Venture 1 — Digital', color: '#3b82f6', badgeClass: 'badge-v1',  accent: '#60a5fa' },
  v2:        { label: 'Venture 2 — SaaS',    color: '#8b5cf6', badgeClass: 'badge-v2',  accent: '#a78bfa' },
  v3:        { label: 'Venture 3 — Dashboard',color: '#06b6d4', badgeClass: 'badge-v3', accent: '#22d3ee' },
  v4:        { label: 'Venture 4 — PaaS',    color: '#10b981', badgeClass: 'badge-v4',  accent: '#34d399' },
  finance:   { label: "Leo's Finance",        color: '#f59e0b', badgeClass: 'badge-fin', accent: '#fbbf24' },
};

export const AGENTS: Agent[] = [
  // ── Ownership layer (Level 1) ──────────────────────────────────────────
  {
    id: 'agent-nico', name: 'Nico', role: 'CTO',
    machine: 'Mac Studio M4 Max', ip: '192.168.50.10', os: 'macOS 15.2',
    model: 'claude-sonnet-4-6', hierarchyLevel: 1, reportsTo: null,
    venture: 'ownership', isActive: true,
    status: 'online', cpuPercent: 18, ramPercent: 42, diskPercent: 31, nanoclaw: true,
    uptime: '14d 6h', currentTask: 'Building Quorbz Nexus — Stage 1',
  },
  {
    id: 'agent-leo', name: 'Leo', role: 'CFO / Legal',
    machine: 'DL380', ip: '192.168.50.112', os: 'Ubuntu 24.04',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 1, reportsTo: null,
    venture: 'finance', isActive: true,
    status: 'online', cpuPercent: 22, ramPercent: 55, diskPercent: 62, nanoclaw: true,
    uptime: '8d 17h', currentTask: 'Reviewing compliance framework',
  },

  // ── Executive layer (Level 2) ─────────────────────────────────────────
  {
    id: 'agent-elena', name: 'Elena', role: 'President',
    machine: 'DL360', ip: '192.168.50.43', os: 'Ubuntu 24.04',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 2, reportsTo: null,
    venture: 'v1', isActive: true,
    status: 'online', cpuPercent: 34, ramPercent: 61, diskPercent: 48, nanoclaw: true,
    uptime: '8d 17h', currentTask: 'Coordinating V1 product pipeline',
  },

  // ── V1 Lead (Level 3) ─────────────────────────────────────────────────
  {
    id: 'agent-aria', name: 'Aria', role: 'V1 Products Lead',
    machine: 'Mac Mini M4', ip: '192.168.50.20', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-elena',
    venture: 'v1', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },

  // ── V1 Team (Level 4) ─────────────────────────────────────────────────
  {
    id: 'agent-mila', name: 'Mila', role: 'CMO',
    machine: 'Mac Studio M4 Max', ip: '192.168.50.11', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-elena',
    venture: 'v1', isActive: true,
    status: 'online', cpuPercent: 51, ramPercent: 73, diskPercent: 28, nanoclaw: true,
    uptime: '6d 2h', currentTask: 'Generating 20 Etsy listing assets',
  },
  {
    id: 'agent-marco', name: 'Marco', role: 'CPO',
    machine: 'Mac Mini M4 24GB', ip: '192.168.50.12', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-elena',
    venture: 'v1', isActive: true,
    status: 'degraded', cpuPercent: 9, ramPercent: 38, diskPercent: 44, nanoclaw: false,
    uptime: '6d 2h', currentTask: null,
  },
  {
    id: 'agent-maya', name: 'Maya', role: 'CSO',
    machine: 'Mac Mini M4', ip: '192.168.50.13', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-elena',
    venture: 'v1', isActive: true,
    status: 'online', cpuPercent: 27, ramPercent: 49, diskPercent: 36, nanoclaw: true,
    uptime: '6d 2h', currentTask: 'Writing copy for 5 product listings',
  },

  // ── V2 Lead (Level 3) ─────────────────────────────────────────────────
  {
    id: 'agent-kai', name: 'Kai', role: 'V2 SaaS Lead',
    machine: 'Mac Mini M4', ip: '192.168.50.21', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-elena',
    venture: 'v2', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },

  // ── V2 Team (Level 4) ─────────────────────────────────────────────────
  {
    id: 'agent-sage', name: 'Sage', role: 'SaaS Architect',
    machine: 'Mac Mini M4', ip: '192.168.50.22', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-kai',
    venture: 'v2', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-atlas', name: 'Atlas', role: 'SaaS Engineer',
    machine: 'Mac Mini M4', ip: '192.168.50.23', os: 'macOS 15.2',
    model: 'grok-code-fast-1', hierarchyLevel: 4, reportsTo: 'agent-kai',
    venture: 'v2', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-quinn', name: 'Quinn', role: 'QA Engineer',
    machine: 'Mac Mini M4', ip: '192.168.50.24', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-kai',
    venture: 'v2', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },

  // ── V3 Lead (Level 3) ─────────────────────────────────────────────────
  {
    id: 'agent-nova', name: 'Nova', role: 'V3 Dashboard Lead',
    machine: 'Mac Mini M4', ip: '192.168.50.30', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-elena',
    venture: 'v3', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },

  // ── V3 Team (Level 4) ─────────────────────────────────────────────────
  {
    id: 'agent-iris', name: 'Iris', role: 'UX Designer',
    machine: 'Mac Mini M4', ip: '192.168.50.31', os: 'macOS 15.2',
    model: 'grok-imagine-image-pro', hierarchyLevel: 4, reportsTo: 'agent-nova',
    venture: 'v3', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-orion', name: 'Orion', role: 'Backend Engineer',
    machine: 'Mac Mini M4', ip: '192.168.50.32', os: 'macOS 15.2',
    model: 'grok-code-fast-1', hierarchyLevel: 4, reportsTo: 'agent-nova',
    venture: 'v3', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-hex', name: 'Hex', role: 'Security Specialist',
    machine: 'Mac Mini M4', ip: '192.168.50.33', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-nova',
    venture: 'v3', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },

  // ── V4 Lead (Level 3) ─────────────────────────────────────────────────
  {
    id: 'agent-rex', name: 'Rex', role: 'V4 PaaS Lead',
    machine: 'Mac Mini M4', ip: '192.168.50.40', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-elena',
    venture: 'v4', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },

  // ── V4 Team (Level 4) ─────────────────────────────────────────────────
  {
    id: 'agent-zara', name: 'Zara', role: 'Platform Architect',
    machine: 'Mac Mini M4', ip: '192.168.50.41', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-rex',
    venture: 'v4', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-echo', name: 'Echo', role: 'DevRel & Docs',
    machine: 'Mac Mini M4', ip: '192.168.50.42', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-rex',
    venture: 'v4', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-flux', name: 'Flux', role: 'Integration Specialist',
    machine: 'Mac Mini M4', ip: '192.168.50.43', os: 'macOS 15.2',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-rex',
    venture: 'v4', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },

  // ── Leo's Finance team (Level 3 Lead + Level 4) ───────────────────────
  {
    id: 'agent-vex', name: 'Vex', role: 'Finance Lead',
    machine: 'DL380', ip: '192.168.50.50', os: 'Ubuntu 24.04',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-leo',
    venture: 'finance', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-clio', name: 'Clio', role: 'Financial Analyst',
    machine: 'DL380', ip: '192.168.50.51', os: 'Ubuntu 24.04',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-vex',
    venture: 'finance', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-juno', name: 'Juno', role: 'Legal Analyst',
    machine: 'DL380', ip: '192.168.50.52', os: 'Ubuntu 24.04',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-vex',
    venture: 'finance', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
  {
    id: 'agent-max', name: 'Max', role: 'Compliance Officer',
    machine: 'DL380', ip: '192.168.50.53', os: 'Ubuntu 24.04',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-vex',
    venture: 'finance', isActive: false,
    status: 'unknown', cpuPercent: 0, ramPercent: 0, diskPercent: 0, nanoclaw: false,
    uptime: '—', currentTask: null,
  },
];

export const ACTIVE_AGENTS = AGENTS.filter((a) => a.isActive);
export const FUTURE_AGENTS = AGENTS.filter((a) => !a.isActive);

export function getAgent(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}
