import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { broadcast } from '../services/websocket.js';
import { z } from 'zod';

const router = Router();

// Pipeline stages in order
export const PIPELINE_STAGES = [
  'research',
  'leo_precheck',
  'build',
  'copy',
  'leo_final',
  'benjamin_approval',
  'publish',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

const CreateItemSchema = z.object({
  title: z.string().min(1),
  venture: z.string(),
  assignedLeadId: z.string().optional(),
});

const UpdateItemSchema = z.object({
  currentStage: z.enum(PIPELINE_STAGES).optional(),
  status: z.enum(['active', 'blocked', 'approved', 'rejected', 'published']).optional(),
  blockReason: z.string().optional(),
  assignedLeadId: z.string().optional(),
});

// GET /api/pipeline
router.get('/', requireAuth, async (req, res) => {
  const { venture, status } = req.query;
  const items = await prisma.pipelineItem.findMany({
    where: {
      ...(venture ? { venture: venture as string } : {}),
      ...(status ? { status: status as string } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(items);
});

// POST /api/pipeline
router.post('/', requireAuth, async (req, res) => {
  const parsed = CreateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const item = await prisma.pipelineItem.create({
    data: {
      title: parsed.data.title,
      venture: parsed.data.venture,
      currentStage: 'research',
      status: 'active',
      assignedLeadId: parsed.data.assignedLeadId ?? null,
      stageHistory: [{ stage: 'research', enteredAt: new Date().toISOString() }],
    },
  });

  broadcast({ type: 'pipeline_update', payload: item });
  res.status(201).json(item);
});

// PATCH /api/pipeline/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const parsed = UpdateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const current = await prisma.pipelineItem.findUnique({ where: { id: req.params.id } });
  if (!current) {
    res.status(404).json({ error: 'Pipeline item not found' });
    return;
  }

  const stageHistory = (current.stageHistory as Array<Record<string, string>>) ?? [];
  if (parsed.data.currentStage && parsed.data.currentStage !== current.currentStage) {
    // Close out the old stage
    const lastEntry = stageHistory[stageHistory.length - 1];
    if (lastEntry && !lastEntry.exitedAt) {
      lastEntry.exitedAt = new Date().toISOString();
    }
    stageHistory.push({ stage: parsed.data.currentStage, enteredAt: new Date().toISOString() });
  }

  const item = await prisma.pipelineItem.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      stageHistory,
    },
  });

  broadcast({ type: 'pipeline_update', payload: item });
  res.json(item);
});

export default router;
