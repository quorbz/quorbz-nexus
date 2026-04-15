import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const ScheduleSchema = z.object({
  name: z.string().min(1),
  agentId: z.string(),
  cronExpr: z.string(),
  prompt: z.string(),
  isActive: z.boolean().default(true),
});

// GET /api/schedules
router.get('/', requireAuth, async (req, res) => {
  const { agentId } = req.query;
  const schedules = await prisma.schedule.findMany({
    where: agentId ? { agentId: agentId as string } : {},
    include: { agentId: false },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(schedules);
});

// POST /api/schedules
router.post('/', requireAuth, async (req, res) => {
  const parsed = ScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const schedule = await prisma.schedule.create({ data: parsed.data });
  res.status(201).json(schedule);
});

// PATCH /api/schedules/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const schema = ScheduleSchema.partial().extend({
    lastResult: z.string().optional(),
    lastError: z.string().optional(),
    lastRunAt: z.string().datetime().optional(),
    nextRunAt: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const schedule = await prisma.schedule.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      lastRunAt: parsed.data.lastRunAt ? new Date(parsed.data.lastRunAt) : undefined,
      nextRunAt: parsed.data.nextRunAt ? new Date(parsed.data.nextRunAt) : undefined,
    },
  });
  res.json(schedule);
});

// DELETE /api/schedules/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.schedule.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
