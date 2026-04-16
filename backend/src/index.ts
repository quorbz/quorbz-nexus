import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config.js';
import { initWebSocket } from './services/websocket.js';
import { initTelegram } from './services/telegram.js';
import { startHeartbeatMonitor } from './services/heartbeat-monitor.js';

// Routes
import authRouter from './routes/auth.js';
import agentsRouter from './routes/agents.js';
import heartbeatRouter from './routes/heartbeat.js';
import tasksRouter from './routes/tasks.js';
import pipelineRouter from './routes/pipeline.js';
import budgetRouter from './routes/budget.js';
import securityRouter from './routes/security.js';
import synthesizerRouter from './routes/synthesizer.js';
import schedulesRouter from './routes/schedules.js';
import knowledgeRouter from './routes/knowledge.js';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

// Health check — unauthenticated, used by heartbeat agents and monitoring
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/heartbeat', heartbeatRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/security', securityRouter);
app.use('/api/synthesizer', synthesizerRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/knowledge', knowledgeRouter);

// Create HTTP server (WebSocket attaches to same server)
const server = http.createServer(app);

// Init services
initWebSocket(server);
initTelegram();
startHeartbeatMonitor();

server.listen(config.port, () => {
  console.log(`[nexus] Backend running on port ${config.port}`);
  console.log(`[nexus] Environment: ${config.nodeEnv}`);
  if (!config.telegramBotToken) {
    console.warn('[nexus] ⚠  NEXUS_TELEGRAM_BOT_TOKEN not set — alerts disabled');
  }
  if (!config.anthropicBillingKey) {
    console.warn('[nexus] ⚠  ANTHROPIC_BILLING_KEY not set — cost tracking is manual entry only');
  }
  if (!config.xaiBillingKey) {
    console.warn('[nexus] ⚠  XAI_BILLING_KEY not set — xAI cost tracking is manual entry only');
  }
});

export default app;
