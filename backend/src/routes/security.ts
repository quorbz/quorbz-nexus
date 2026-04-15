import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendAlert } from '../services/telegram.js';
import { z } from 'zod';

const router = Router();

// GET /api/security/incidents
router.get('/incidents', requireAuth, async (req, res) => {
  const { severity, acknowledged, agentId } = req.query;
  const incidents = await prisma.incident.findMany({
    where: {
      ...(severity ? { severity: severity as string } : {}),
      ...(acknowledged !== undefined ? { acknowledged: acknowledged === 'true' } : {}),
      ...(agentId ? { agentId: agentId as string } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(incidents);
});

// POST /api/security/incident — report an incident from any agent machine
const IncidentSchema = z.object({
  agentId: z.string().optional(),
  type: z.enum(['ssh_fail', 'outbound_anomaly', 'file_modified', 'port_scan', 'process_anomaly', 'login_attempt']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  source: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

router.post('/incident', async (req, res) => {
  const parsed = IncidentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const incident = await prisma.incident.create({ data: parsed.data });

  if (parsed.data.severity === 'high' || parsed.data.severity === 'critical') {
    await sendAlert(
      `*[Nexus Security — ${parsed.data.severity.toUpperCase()}]* ${parsed.data.type} on ${parsed.data.source}\n${parsed.data.description}`
    );
  }

  res.status(201).json(incident);
});

// PATCH /api/security/incidents/:id/acknowledge
router.patch('/incidents/:id/acknowledge', requireAuth, async (req, res) => {
  const incident = await prisma.incident.update({
    where: { id: req.params.id },
    data: { acknowledged: true, acknowledgedAt: new Date() },
  });
  res.json(incident);
});

// PATCH /api/security/incidents/:id/resolve
router.patch('/incidents/:id/resolve', requireAuth, async (req, res) => {
  const incident = await prisma.incident.update({
    where: { id: req.params.id },
    data: { acknowledged: true, acknowledgedAt: new Date(), resolvedAt: new Date() },
  });
  res.json(incident);
});

// GET /api/security/summary — open incident counts by severity
router.get('/summary', requireAuth, async (_req, res) => {
  const counts = await prisma.incident.groupBy({
    by: ['severity'],
    where: { acknowledged: false },
    _count: true,
  });
  res.json(counts);
});

export default router;
