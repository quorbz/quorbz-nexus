import { Router } from 'express';
import { prisma } from '../db.js';
import { sendOtp } from '../services/telegram.js';
import { config } from '../config.js';
import { z } from 'zod';

const router = Router();

function randomOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/request-otp
// Body: { chatId: string } — Benjamin's Telegram chat ID
router.post('/request-otp', async (req, res) => {
  const schema = z.object({ chatId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Only allow the admin chat ID
  if (parsed.data.chatId !== config.telegramAdminChatId) {
    // Return same response to avoid enumeration
    res.json({ ok: true });
    return;
  }

  const otp = randomOtp();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  const session = await prisma.authSession.create({
    data: {
      otp,
      otpExpiry,
      verified: false,
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
      expiresAt: new Date(Date.now() + config.sessionTtlHours * 60 * 60 * 1000),
    },
  });

  await sendOtp(parsed.data.chatId, otp);
  res.json({ sessionId: session.id });
});

// POST /api/auth/verify-otp
// Body: { sessionId: string, otp: string }
router.post('/verify-otp', async (req, res) => {
  const schema = z.object({ sessionId: z.string(), otp: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const session = await prisma.authSession.findUnique({
    where: { id: parsed.data.sessionId },
  });

  if (
    !session ||
    session.verified ||
    !session.otp ||
    !session.otpExpiry ||
    session.otpExpiry < new Date()
  ) {
    res.status(401).json({ error: 'Invalid or expired OTP' });
    return;
  }

  if (session.otp !== parsed.data.otp) {
    res.status(401).json({ error: 'Incorrect OTP' });
    return;
  }

  const verified = await prisma.authSession.update({
    where: { id: session.id },
    data: { verified: true, otp: null, otpExpiry: null },
  });

  res.json({ token: verified.token, expiresAt: verified.expiresAt });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.headers['x-nexus-token'] as string | undefined;
  if (token) {
    await prisma.authSession.deleteMany({ where: { token } }).catch(() => {});
  }
  res.json({ ok: true });
});

export default router;
