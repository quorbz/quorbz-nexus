/**
 * Nexus Heartbeat Agent
 * Runs on each agent machine. Reports machine health to Quorbz Nexus every 5 minutes.
 *
 * Config (env vars or .env file):
 *   NEXUS_URL        — http://192.168.50.x:3001  (Nexus backend on DL380)
 *   NEXUS_AGENT_ID   — agent-elena, agent-nico, etc.
 *   HEARTBEAT_INTERVAL_SECS — default 300 (5 min)
 */
import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const NEXUS_URL = process.env.NEXUS_URL ?? '';
const AGENT_ID = process.env.NEXUS_AGENT_ID ?? '';
const INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_SECS ?? '300', 10) * 1000;

if (!NEXUS_URL || !AGENT_ID) {
  console.error('[heartbeat] NEXUS_URL and NEXUS_AGENT_ID must be set');
  process.exit(1);
}

function cpuPercent(): number {
  // Sample CPU over 100ms
  const cpus1 = os.cpus();
  const t1 = Date.now();
  // Sync wait — acceptable for a heartbeat reporter
  while (Date.now() - t1 < 200) { /* spin */ }
  const cpus2 = os.cpus();

  let idle = 0, total = 0;
  for (let i = 0; i < cpus1.length; i++) {
    const c1 = cpus1[i].times;
    const c2 = cpus2[i].times;
    idle  += (c2.idle  - c1.idle);
    total += (c2.idle + c2.user + c2.nice + c2.sys + c2.irq) -
             (c1.idle + c1.user + c1.nice + c1.sys + c1.irq);
  }
  return total > 0 ? Math.round(((total - idle) / total) * 100) : 0;
}

function ramPercent(): number {
  const total = os.totalmem();
  const free  = os.freemem();
  return Math.round(((total - free) / total) * 100);
}

function diskPercent(): number | undefined {
  try {
    // Works on Linux and macOS
    const out = execSync("df -h / | tail -1 | awk '{print $5}'").toString().trim().replace('%', '');
    return parseInt(out, 10);
  } catch {
    return undefined;
  }
}

function isNanoclawRunning(): boolean {
  try {
    const out = execSync("pgrep -f 'nanoclaw.*dist/index.js' || pgrep -f 'node.*nanoclaw'").toString().trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function uptimeSecs(): number {
  return Math.floor(os.uptime());
}

async function sendHeartbeat(): Promise<void> {
  const cpu = cpuPercent();
  const ram = ramPercent();
  const disk = diskPercent();
  const nanoclaw = isNanoclawRunning();
  const uptime = uptimeSecs();

  const status = cpu > 95 || ram > 95 ? 'degraded' : 'healthy';

  const payload = {
    agentId: AGENT_ID,
    status,
    cpuPercent: cpu,
    ramPercent: ram,
    diskPercent: disk,
    nanoclaw,
    nodeVersion: process.version,
    uptimeSecs: uptime,
  };

  try {
    const res = await fetch(`${NEXUS_URL}/api/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[heartbeat] Server responded ${res.status}`);
    } else {
      console.log(`[heartbeat] ✓ sent — cpu:${cpu}% ram:${ram}% disk:${disk ?? '?'}% nanoclaw:${nanoclaw}`);
    }
  } catch (err) {
    console.error('[heartbeat] Failed to reach Nexus:', err);
    // Non-fatal — will retry on next interval
  }
}

console.log(`[heartbeat] Starting for agent ${AGENT_ID} → ${NEXUS_URL} (every ${INTERVAL_MS / 1000}s)`);
sendHeartbeat(); // immediate first ping
setInterval(sendHeartbeat, INTERVAL_MS);
