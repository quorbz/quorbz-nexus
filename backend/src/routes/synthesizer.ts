import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// GET /api/synthesizer/feed — latest entries for the synthesizer tab
// This endpoint is also used by the kiosk/rack view — no auth so the rack page loads without login
router.get('/feed', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string ?? '50', 10), 200);
  const since = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const entries = await prisma.synthesizerEntry.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      createdAt: { gte: since },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });

  res.json(entries);
});

// GET /api/synthesizer/snapshot — real-time status snapshot (agent grid, open blockers, cost today)
// Also unauthenticated for rack view
router.get('/snapshot', async (_req, res) => {
  const [agents, openBlockers, unacknowledgedIncidents, todaysCost] = await Promise.all([
    prisma.agent.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true, hierarchyLevel: true },
    }),
    prisma.task.findMany({
      where: { status: 'blocked' },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.incident.count({ where: { acknowledged: false, severity: { in: ['high', 'critical'] } } }),
    prisma.costEntry.aggregate({
      _sum: { costUsd: true },
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ]);

  // Get latest heartbeat per agent
  const agentsWithStatus = await Promise.all(
    agents.map(async (a) => {
      const hb = await prisma.heartbeat.findFirst({
        where: { agentId: a.id },
        orderBy: { timestamp: 'desc' },
      });
      const cutoff = new Date(Date.now() - 7.5 * 60 * 1000); // 7.5 min
      const status =
        !hb ? 'unknown' : hb.timestamp >= cutoff ? hb.status : 'offline';
      return { ...a, status, lastHeartbeat: hb?.timestamp ?? null };
    })
  );

  res.json({
    agents: agentsWithStatus,
    openBlockers,
    criticalIncidents: unacknowledgedIncidents,
    todaySpendUsd: todaysCost._sum.costUsd ?? 0,
    ts: new Date().toISOString(),
  });
});

// POST /api/synthesizer/entry — add an entry to the feed (used by agents or scheduled jobs)
router.post('/entry', requireAuth, async (req, res) => {
  const schema = z.object({
    type: z.enum(['briefing', 'alert', 'milestone', 'status_change', 'blocker']),
    title: z.string(),
    body: z.string(),
    priority: z.number().default(0),
    agentId: z.string().optional(),
    venture: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    expiresAt: z.string().datetime().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const entry = await prisma.synthesizerEntry.create({
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  res.status(201).json(entry);
});

export default router;
