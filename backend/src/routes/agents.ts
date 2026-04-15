import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import type { AgentStatus } from '../types/index.js';

const router = Router();

// GET /api/agents — list all agents with latest heartbeat status
router.get('/', requireAuth, async (_req, res) => {
  const agents = await prisma.agent.findMany({
    orderBy: [{ hierarchyLevel: 'asc' }, { name: 'asc' }],
  });

  const cutoff = new Date(Date.now() - config.heartbeatIntervalSecs * 1000 * 1.5);

  const agentsWithStatus = await Promise.all(
    agents.map(async (agent) => {
      const latest = await prisma.heartbeat.findFirst({
        where: { agentId: agent.id },
        orderBy: { timestamp: 'desc' },
      });

      const currentTask = await prisma.task.findFirst({
        where: { assignedToId: agent.id, status: 'in_progress' },
        select: { title: true },
      });

      let status: AgentStatus = 'unknown';
      if (latest) {
        if (latest.timestamp >= cutoff) {
          status = latest.status as AgentStatus;
        } else {
          status = 'offline';
        }
      }

      return {
        ...agent,
        status,
        lastHeartbeat: latest?.timestamp ?? null,
        currentTask: currentTask?.title ?? null,
        latestHeartbeat: latest ?? null,
      };
    })
  );

  res.json(agentsWithStatus);
});

// GET /api/agents/:id
router.get('/:id', requireAuth, async (req, res) => {
  const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.json(agent);
});

// GET /api/agents/:id/heartbeats — last N heartbeats
router.get('/:id/heartbeats', requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string ?? '100', 10), 500);
  const heartbeats = await prisma.heartbeat.findMany({
    where: { agentId: req.params.id },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  res.json(heartbeats);
});

export default router;
