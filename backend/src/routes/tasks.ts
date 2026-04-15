import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { broadcast } from '../services/websocket.js';
import { z } from 'zod';

const router = Router();

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedToId: z.string(),
  createdById: z.string().optional(),
  sourceVenture: z.string().optional(),
  pipelineStage: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['assigned', 'in_progress', 'blocked', 'review', 'complete']).optional(),
  blockReason: z.string().optional(),
  pipelineStage: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

// GET /api/tasks
router.get('/', requireAuth, async (req, res) => {
  const { status, agentId, venture } = req.query;
  const tasks = await prisma.task.findMany({
    where: {
      ...(status ? { status: status as string } : {}),
      ...(agentId ? { assignedToId: agentId as string } : {}),
      ...(venture ? { sourceVenture: venture as string } : {}),
    },
    include: {
      assignedTo: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(tasks);
});

// POST /api/tasks
router.post('/', requireAuth, async (req, res) => {
  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      status: 'assigned',
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
    },
    include: {
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  });

  broadcast({ type: 'task_update', payload: task });
  res.status(201).json(task);
});

// PATCH /api/tasks/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const parsed = UpdateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === 'complete') {
    updates.completedAt = new Date();
  }
  if (parsed.data.dueAt) {
    updates.dueAt = new Date(parsed.data.dueAt);
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: updates,
    include: {
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  });

  broadcast({ type: 'task_update', payload: task });
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
