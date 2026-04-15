import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendAlert } from '../services/telegram.js';
import { z } from 'zod';

const router = Router();

// GET /api/budget — current month summary for all agents
router.get('/', requireAuth, async (_req, res) => {
  const month = new Date().toISOString().slice(0, 7); // "2026-04"

  const budgets = await prisma.budget.findMany({
    where: { month },
    include: { agent: { select: { id: true, name: true, role: true, model: true } } },
  });

  // Cost totals per agent this month
  const costs = await prisma.costEntry.groupBy({
    by: ['agentId'],
    where: {
      date: {
        gte: new Date(`${month}-01`),
        lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
      },
    },
    _sum: { costUsd: true, inputTokens: true, outputTokens: true },
  });

  const costMap = new Map(costs.map((c) => [c.agentId, c]));

  const summary = budgets.map((b) => {
    const cost = costMap.get(b.agentId);
    return {
      ...b,
      actualSpentUsd: cost?._sum.costUsd ?? b.spentUsd,
      inputTokensTotal: cost?._sum.inputTokens ?? 0,
      outputTokensTotal: cost?._sum.outputTokens ?? 0,
      percentUsed: b.limitUsd > 0 ? ((cost?._sum.costUsd ?? b.spentUsd) / b.limitUsd) * 100 : 0,
    };
  });

  const totalSpend = summary.reduce((sum, b) => sum + b.actualSpentUsd, 0);
  const totalLimit = summary.reduce((sum, b) => sum + b.limitUsd, 0);

  res.json({ month, summary, totalSpend, totalLimit });
});

// GET /api/budget/history — daily cost entries, last 30 days
router.get('/history', requireAuth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days as string ?? '30', 10), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const entries = await prisma.costEntry.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'desc' },
    include: { agentId: false },
  });

  res.json(entries);
});

// POST /api/budget/entry — manual cost entry (until billing API keys are available)
const CostEntrySchema = z.object({
  agentId: z.string(),
  date: z.string().datetime(),
  inputTokens: z.number().default(0),
  outputTokens: z.number().default(0),
  costUsd: z.number(),
  model: z.string(),
  source: z.enum(['anthropic_api', 'xai_api', 'manual']).default('manual'),
});

router.post('/entry', requireAuth, async (req, res) => {
  const parsed = CostEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const entry = await prisma.costEntry.create({
    data: { ...parsed.data, date: new Date(parsed.data.date) },
  });

  // Update budget spent amount and check alert threshold
  const month = new Date(parsed.data.date).toISOString().slice(0, 7);
  const budget = await prisma.budget.findUnique({
    where: { agentId_month: { agentId: parsed.data.agentId, month } },
    include: { agent: { select: { name: true } } },
  });

  if (budget) {
    const newSpent = budget.spentUsd + parsed.data.costUsd;
    const shouldAlert = !budget.alerted && newSpent >= budget.limitUsd * budget.alertAt;

    await prisma.budget.update({
      where: { id: budget.id },
      data: { spentUsd: newSpent, alerted: shouldAlert ? true : budget.alerted },
    });

    if (shouldAlert) {
      const pct = Math.round((newSpent / budget.limitUsd) * 100);
      await sendAlert(
        `*[Nexus Budget Alert]* ${budget.agent.name} has used ${pct}% of their monthly budget ($${newSpent.toFixed(2)} / $${budget.limitUsd.toFixed(2)}).`
      );
    }
  }

  res.status(201).json(entry);
});

// PUT /api/budget/limit — set monthly budget for an agent
router.put('/limit', requireAuth, async (req, res) => {
  const schema = z.object({
    agentId: z.string(),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    limitUsd: z.number().positive(),
    alertAt: z.number().min(0).max(1).default(0.8),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const budget = await prisma.budget.upsert({
    where: { agentId_month: { agentId: parsed.data.agentId, month: parsed.data.month } },
    create: { ...parsed.data, updatedAt: new Date() },
    update: { limitUsd: parsed.data.limitUsd, alertAt: parsed.data.alertAt, updatedAt: new Date() },
  });

  res.json(budget);
});

export default router;
