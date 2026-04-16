/**
 * Seed file — populates the database with the full Quorbz agent roster (24 agents).
 * Run: npm run db:seed
 */
import { prisma } from './db.js';

interface AgentSeed {
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
  orchestrationScope: string[];
  budgetLimitUsd?: number;
}

const AGENTS: AgentSeed[] = [
  // ── Ownership layer (Level 1) ─────────────────────────────────────────────
  {
    id: 'agent-nico', name: 'Nico', role: 'CTO',
    machine: 'Mac Studio M4 Max', ip: '192.168.50.10', os: 'macOS',
    model: 'claude-sonnet-4-6', hierarchyLevel: 1, reportsTo: null,
    venture: null, orchestrationScope: [],
    budgetLimitUsd: 50,
  },
  {
    id: 'agent-leo', name: 'Leo', role: 'CFO / Legal',
    machine: 'DL380', ip: '192.168.50.112', os: 'Linux',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 1, reportsTo: null,
    venture: null, orchestrationScope: ['agent-vex', 'agent-clio', 'agent-juno', 'agent-max'],
    budgetLimitUsd: 100,
  },

  // ── Executive layer (Level 2) ─────────────────────────────────────────────
  {
    id: 'agent-elena', name: 'Elena', role: 'President',
    machine: 'DL360', ip: '192.168.50.43', os: 'Linux',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 2, reportsTo: null,
    venture: null,
    orchestrationScope: [
      'agent-aria', 'agent-kai', 'agent-nova', 'agent-rex',
      'agent-mila', 'agent-marco', 'agent-maya',
    ],
    budgetLimitUsd: 100,
  },

  // ── Agent 7 — CS Chatbot ──────────────────────────────────────────────────
  {
    id: 'agent-pico', name: 'Pico', role: 'CS Chatbot',
    machine: 'Mac Studio M4 Max', ip: '192.168.50.10', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-nico',
    venture: 'venture-1', orchestrationScope: [],
  },

  // ── V1 Lead (Level 3) ─────────────────────────────────────────────────────
  {
    id: 'agent-aria', name: 'Aria', role: 'V1 Products Lead',
    machine: 'Mac Mini M4', ip: '192.168.50.20', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-elena',
    venture: 'venture-1', orchestrationScope: ['agent-mila', 'agent-marco', 'agent-maya'],
  },

  // ── V1 Team (Level 4) ─────────────────────────────────────────────────────
  {
    id: 'agent-mila', name: 'Mila', role: 'CMO',
    machine: 'Mac Studio M4 Max', ip: '192.168.50.11', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-elena',
    venture: 'venture-1', orchestrationScope: [],
    budgetLimitUsd: 75,
  },
  {
    id: 'agent-marco', name: 'Marco', role: 'CPO',
    machine: 'Mac Mini M4 24GB', ip: '192.168.50.12', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-elena',
    venture: 'venture-1', orchestrationScope: [],
    budgetLimitUsd: 75,
  },
  {
    id: 'agent-maya', name: 'Maya', role: 'CSO',
    machine: 'Mac Mini M4', ip: '192.168.50.13', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-elena',
    venture: 'venture-1', orchestrationScope: [],
    budgetLimitUsd: 75,
  },

  // ── V2 Lead (Level 3) ─────────────────────────────────────────────────────
  {
    id: 'agent-kai', name: 'Kai', role: 'V2 SaaS Lead',
    machine: 'Mac Mini M4', ip: '192.168.50.21', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-elena',
    venture: 'venture-2', orchestrationScope: ['agent-sage', 'agent-atlas', 'agent-quinn'],
  },

  // ── V2 Team (Level 4) ─────────────────────────────────────────────────────
  {
    id: 'agent-sage', name: 'Sage', role: 'SaaS Architect',
    machine: 'Mac Mini M4', ip: '192.168.50.22', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-kai',
    venture: 'venture-2', orchestrationScope: [],
  },
  {
    id: 'agent-atlas', name: 'Atlas', role: 'SaaS Engineer',
    machine: 'Mac Mini M4', ip: '192.168.50.23', os: 'macOS',
    model: 'grok-code-fast-1', hierarchyLevel: 4, reportsTo: 'agent-kai',
    venture: 'venture-2', orchestrationScope: [],
  },
  {
    id: 'agent-quinn', name: 'Quinn', role: 'QA Engineer',
    machine: 'Mac Mini M4', ip: '192.168.50.24', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-kai',
    venture: 'venture-2', orchestrationScope: [],
  },

  // ── V3 Lead (Level 3) ─────────────────────────────────────────────────────
  {
    id: 'agent-nova', name: 'Nova', role: 'V3 Dashboard Lead',
    machine: 'Mac Mini M4', ip: '192.168.50.30', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-elena',
    venture: 'venture-3', orchestrationScope: ['agent-iris', 'agent-orion', 'agent-hex'],
  },

  // ── V3 Team (Level 4) ─────────────────────────────────────────────────────
  {
    id: 'agent-iris', name: 'Iris', role: 'UX Designer',
    machine: 'Mac Mini M4', ip: '192.168.50.31', os: 'macOS',
    model: 'grok-imagine-image-pro', hierarchyLevel: 4, reportsTo: 'agent-nova',
    venture: 'venture-3', orchestrationScope: [],
  },
  {
    id: 'agent-orion', name: 'Orion', role: 'Backend Engineer',
    machine: 'Mac Mini M4', ip: '192.168.50.32', os: 'macOS',
    model: 'grok-code-fast-1', hierarchyLevel: 4, reportsTo: 'agent-nova',
    venture: 'venture-3', orchestrationScope: [],
  },
  {
    id: 'agent-hex', name: 'Hex', role: 'Security Specialist',
    machine: 'Mac Mini M4', ip: '192.168.50.33', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-nova',
    venture: 'venture-3', orchestrationScope: [],
  },

  // ── V4 Lead (Level 3) ─────────────────────────────────────────────────────
  {
    id: 'agent-rex', name: 'Rex', role: 'V4 PaaS Lead',
    machine: 'Mac Mini M4', ip: '192.168.50.40', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-elena',
    venture: 'venture-4', orchestrationScope: ['agent-zara', 'agent-echo', 'agent-flux'],
  },

  // ── V4 Team (Level 4) ─────────────────────────────────────────────────────
  {
    id: 'agent-zara', name: 'Zara', role: 'Platform Architect',
    machine: 'Mac Mini M4', ip: '192.168.50.41', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-rex',
    venture: 'venture-4', orchestrationScope: [],
  },
  {
    id: 'agent-echo', name: 'Echo', role: 'DevRel & Docs',
    machine: 'Mac Mini M4', ip: '192.168.50.42', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-rex',
    venture: 'venture-4', orchestrationScope: [],
  },
  {
    id: 'agent-flux', name: 'Flux', role: 'Integration Specialist',
    machine: 'Mac Mini M4', ip: '192.168.50.44', os: 'macOS',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-rex',
    venture: 'venture-4', orchestrationScope: [],
  },

  // ── Leo's Finance / Legal team ────────────────────────────────────────────
  {
    id: 'agent-vex', name: 'Vex', role: 'Finance Lead',
    machine: 'DL380', ip: '192.168.50.50', os: 'Linux',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 3, reportsTo: 'agent-leo',
    venture: null, orchestrationScope: ['agent-clio', 'agent-juno', 'agent-max'],
  },
  {
    id: 'agent-clio', name: 'Clio', role: 'Financial Analyst',
    machine: 'DL380', ip: '192.168.50.51', os: 'Linux',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-vex',
    venture: null, orchestrationScope: [],
  },
  {
    id: 'agent-juno', name: 'Juno', role: 'Legal Analyst',
    machine: 'DL380', ip: '192.168.50.52', os: 'Linux',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-vex',
    venture: null, orchestrationScope: [],
  },
  {
    id: 'agent-max', name: 'Max', role: 'Compliance Officer',
    machine: 'DL380', ip: '192.168.50.53', os: 'Linux',
    model: 'grok-4-1-fast-reasoning', hierarchyLevel: 4, reportsTo: 'agent-vex',
    venture: null, orchestrationScope: [],
  },
];

async function main() {
  console.log('Seeding full Quorbz agent roster (24 agents)...\n');

  const created: { id: string }[] = [];

  for (const agent of AGENTS) {
    const record = await prisma.agent.upsert({
      where: { id: agent.id },
      update: {},
      create: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        machine: agent.machine,
        ip: agent.ip,
        os: agent.os,
        model: agent.model,
        hierarchyLevel: agent.hierarchyLevel,
        reportsTo: agent.reportsTo,
        venture: agent.venture,
        orchestrationScope: agent.orchestrationScope,
      },
    });
    created.push(record);
    console.log(`  ✓ ${agent.name.padEnd(8)} — ${agent.role}`);
  }

  // Seed April 2026 budgets for active agents
  const month = '2026-04';
  const budgetAgents = AGENTS.filter((a) => a.budgetLimitUsd);

  console.log('\nSeeding budgets...');
  for (const agent of budgetAgents) {
    await prisma.budget.upsert({
      where: { agentId_month: { agentId: agent.id, month } },
      update: {},
      create: {
        agentId: agent.id,
        month,
        limitUsd: agent.budgetLimitUsd!,
        spentUsd: 0,
        alertAt: 0.8,
        updatedAt: new Date(),
      },
    });
    console.log(`  ✓ ${agent.name} — $${agent.budgetLimitUsd}/mo`);
  }

  console.log(`\n✓ ${created.length} agents seeded`);
  console.log('✓ Budget limits seeded for active agents');
  console.log('\nNOTE: IPs for future agents are placeholder ranges.');
  console.log('Update via /api/agents when machines are provisioned.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
