/**
 * GET /api/knowledge — role-scoped knowledge delivery for agent bootstrap
 *
 * Each agent authenticates with their Nexus token. The endpoint fetches
 * documents from the quorbz/knowledge GitHub repo and returns only the
 * subset that agent's role is authorized to see.
 *
 * Query params:
 *   ?section=shared|prompt|role|all  (default: all)
 *   ?refresh=true                    (busts the 5-minute cache)
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';

const router = Router();

// 5-minute in-memory cache keyed by file path
const fileCache = new Map<string, { content: string; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';
const KNOWLEDGE_REPO = 'quorbz/knowledge';

async function fetchFile(path: string, bust = false): Promise<string | null> {
  const cached = fileCache.get(path);
  if (!bust && cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.content;
  }

  try {
    const url = `https://api.github.com/repos/${KNOWLEDGE_REPO}/contents/${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    });
    if (!res.ok) return null;
    const content = await res.text();
    fileCache.set(path, { content, fetchedAt: Date.now() });
    return content;
  } catch {
    return null;
  }
}

// Role → which shared docs they can see
const SHARED_ACCESS: Record<string, string[]> = {
  'agent-elena': ['company_overview', 'pipeline_rules', 'storage_conventions', 'communication_protocol'],
  'agent-leo':   ['company_overview', 'pipeline_rules', 'storage_conventions', 'communication_protocol'],
  'agent-mila':  ['company_overview', 'storage_conventions', 'communication_protocol'],
  'agent-marco': ['company_overview', 'storage_conventions', 'communication_protocol'],
  'agent-maya':  ['company_overview', 'storage_conventions', 'communication_protocol'],
  'agent-pico':  [],
};

router.get('/', requireAuth, async (req, res) => {
  const agentId = (req as any).agentId as string;
  const section = String(req.query.section ?? 'all');
  const bust = req.query.refresh === 'true';

  const agent = await prisma.agent.findUnique({ where: { id: agentId }, select: { id: true, name: true } });
  if (!agent) {
    res.status(403).json({ error: 'Agent not found' });
    return;
  }

  const allowedShared = SHARED_ACCESS[agentId] ?? [];
  const result: Record<string, string | null> = {};

  // Shared docs
  if (section === 'all' || section === 'shared') {
    for (const doc of allowedShared) {
      result[`shared/${doc}`] = await fetchFile(`shared/${doc}.md`, bust);
    }
  }

  // System prompt
  if (section === 'all' || section === 'prompt') {
    const promptKey = agentId.replace('agent-', '');
    result[`prompts/${promptKey}`] = await fetchFile(`prompts/${promptKey}.md`, bust);
  }

  // Role detail
  if (section === 'all' || section === 'role') {
    const roleKey = agentId.replace('agent-', '');
    result[`roles/${roleKey}`] = await fetchFile(`roles/${roleKey}.md`, bust);
  }

  res.json({
    agentId,
    name: agent.name,
    fetchedAt: new Date().toISOString(),
    documents: result,
  });
});

export default router;
