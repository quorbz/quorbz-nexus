/**
 * Seed file — populates the database with the initial Quorbz agent roster.
 * Run: npm run db:seed
 */
import { prisma } from './db.js';

async function main() {
  console.log('Seeding Quorbz agent roster...');

  // Ownership layer (Level 1)
  const nico = await prisma.agent.upsert({
    where: { id: 'agent-nico' },
    update: {},
    create: {
      id: 'agent-nico',
      name: 'Nico',
      role: 'CTO',
      machine: 'Mac Studio M4 Max',
      ip: '192.168.50.10', // TODO: confirm Nico's actual LAN IP
      os: 'macOS',
      model: 'claude-sonnet-4-6',
      hierarchyLevel: 1,
      reportsTo: null,
      venture: null,
      orchestrationScope: [],
    },
  });

  const leo = await prisma.agent.upsert({
    where: { id: 'agent-leo' },
    update: {},
    create: {
      id: 'agent-leo',
      name: 'Leo',
      role: 'CFO / Legal',
      machine: 'DL380',
      ip: '192.168.50.112', // TODO: confirm DL380 IP
      os: 'Linux',
      model: 'grok-4-1-fast-reasoning',
      hierarchyLevel: 1,
      reportsTo: null,
      venture: null,
      orchestrationScope: [],
    },
  });

  // Executive layer (Level 2)
  const elena = await prisma.agent.upsert({
    where: { id: 'agent-elena' },
    update: {},
    create: {
      id: 'agent-elena',
      name: 'Elena',
      role: 'President',
      machine: 'DL360',
      ip: '192.168.50.43',
      os: 'Linux',
      model: 'grok-4-1-fast-reasoning',
      hierarchyLevel: 2,
      reportsTo: null, // reports to Benjamin directly
      venture: null,   // cross-venture
      orchestrationScope: ['agent-mila', 'agent-marco', 'agent-maya'],
    },
  });

  // Contributor layer (Level 4) — Venture 1 team
  const mila = await prisma.agent.upsert({
    where: { id: 'agent-mila' },
    update: {},
    create: {
      id: 'agent-mila',
      name: 'Mila',
      role: 'CMO',
      machine: 'Mac Studio M4 Max',
      ip: '192.168.50.11', // TODO: confirm Mila's LAN IP
      os: 'macOS',
      model: 'grok-4-1-fast-reasoning',
      hierarchyLevel: 4,
      reportsTo: elena.id,
      venture: 'venture-1',
      orchestrationScope: [],
    },
  });

  const marco = await prisma.agent.upsert({
    where: { id: 'agent-marco' },
    update: {},
    create: {
      id: 'agent-marco',
      name: 'Marco',
      role: 'CPO',
      machine: 'Mac Mini M4 24GB',
      ip: '192.168.50.12', // TODO: confirm Marco's LAN IP
      os: 'macOS',
      model: 'grok-4-1-fast-reasoning',
      hierarchyLevel: 4,
      reportsTo: elena.id,
      venture: 'venture-1',
      orchestrationScope: [],
    },
  });

  const maya = await prisma.agent.upsert({
    where: { id: 'agent-maya' },
    update: {},
    create: {
      id: 'agent-maya',
      name: 'Maya',
      role: 'CSO',
      machine: 'Mac Mini M4',
      ip: '192.168.50.13', // TODO: confirm Maya's LAN IP
      os: 'macOS',
      model: 'grok-4-1-fast-reasoning',
      hierarchyLevel: 4,
      reportsTo: elena.id,
      venture: 'venture-1',
      orchestrationScope: [],
    },
  });

  // Seed initial monthly budgets (April 2026)
  const month = '2026-04';
  for (const [agent, limitUsd] of [
    [nico, 50],
    [leo, 100],
    [elena, 100],
    [mila, 75],
    [marco, 75],
    [maya, 75],
  ] as const) {
    await prisma.budget.upsert({
      where: { agentId_month: { agentId: agent.id, month } },
      update: {},
      create: {
        agentId: agent.id,
        month,
        limitUsd: limitUsd as number,
        spentUsd: 0,
        alertAt: 0.8,
        updatedAt: new Date(),
      },
    });
  }

  console.log('✓ Agent roster seeded');
  console.log('✓ Budget limits seeded');
  console.log('');
  console.log('NOTE: IPs marked TODO above — update agents via /api/agents after confirming machine IPs');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
