import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: parseInt(optional('PORT', '3001'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),

  databaseUrl: required('DATABASE_URL'),

  // ── Telegram ──────────────────────────────────────────────────────────────
  // PENDING: Create a dedicated Nexus bot via BotFather and add token here
  telegramBotToken: optional('NEXUS_TELEGRAM_BOT_TOKEN'),
  telegramAdminChatId: optional('NEXUS_TELEGRAM_ADMIN_CHAT_ID'),

  // ── Auth ──────────────────────────────────────────────────────────────────
  sessionSecret: optional('SESSION_SECRET', 'change-me-in-production'),
  sessionTtlHours: parseInt(optional('SESSION_TTL_HOURS', '168'), 10), // 7 days

  // ── Billing APIs (placeholders — populated when keys available) ───────────
  // PENDING: Anthropic Console billing API key
  anthropicBillingKey: optional('ANTHROPIC_BILLING_KEY'),
  // PENDING: xAI Console billing API key
  xaiBillingKey: optional('XAI_BILLING_KEY'),

  // ── Heartbeat thresholds ──────────────────────────────────────────────────
  heartbeatMissedAlertCount: parseInt(optional('HEARTBEAT_MISSED_ALERT_COUNT', '3'), 10),
  heartbeatIntervalSecs: parseInt(optional('HEARTBEAT_INTERVAL_SECS', '300'), 10), // 5 min

  // ── CORS ──────────────────────────────────────────────────────────────────
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),
} as const;
