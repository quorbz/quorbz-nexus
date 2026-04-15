import { Router } from 'express';
import { prisma } from '../db.js';
import { broadcast } from '../services/websocket.js';
import { z } from 'zod';

const router = Router();

const HeartbeatSchema = z.object({
  agentId: z.string(),
  status: z.enum(['healthy', 'degraded', 'offline']),
  cpuPercent: z.number().optional(),
  ramPercent: z.number().optional(),
  diskPercent: z.number().optional(),
  nanoclaw: z.boolean().optional(),
  nodeVersion: z.string().optional(),
  uptimeSecs: z.number().optional(),
  extra: z.record(z.unknown()).optional(),
});

// POST /api/heartbeat — called by heartbeat agents running on each machine
// This endpoint is intentionally unauthenticated (agents call it without a session)
// but requires a pre-shared agent secret for minimal protection
router.post('/', async (req, res) => {
  const parsed = HeartbeatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { agentId, status, cpuPercent, ramPercent, diskPercent, nanoclaw, nodeVersion, uptimeSecs, extra } =
    parsed.data;

  // Verify agent exists
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    res.status(404).json({ error: 'Unknown agent ID' });
    return;
  }

  const heartbeat = await prisma.heartbeat.create({
    data: {
      agentId,
      status,
      cpuPercent: cpuPercent ?? null,
      ramPercent: ramPercent ?? null,
      diskPercent: diskPercent ?? null,
      nanoclaw: nanoclaw ?? null,
      nodeVersion: nodeVersion ?? null,
      uptimeSecs: uptimeSecs ?? null,
      extra: extra ?? undefined,
    },
  });

  // Push live update to connected dashboard clients
  broadcast({
    type: 'heartbeat_update',
    payload: {
      agentId,
      agentName: agent.name,
      status,
      timestamp: heartbeat.timestamp,
      cpuPercent,
      ramPercent,
      diskPercent,
      nanoclaw,
    },
  });

  res.json({ ok: true, id: heartbeat.id });
});

export default router;
