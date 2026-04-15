import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers['x-nexus-token'] as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const session = await prisma.authSession.findUnique({
    where: { token },
  });

  if (!session || !session.verified || session.expiresAt < new Date()) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  next();
}
