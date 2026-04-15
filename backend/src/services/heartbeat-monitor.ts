import cron from 'node-cron';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { sendAlert } from './telegram.js';
import { broadcast } from './websocket.js';

// Track consecutive missed heartbeats per agent
const missedCounts = new Map<string, number>();

export function startHeartbeatMonitor(): void {
  // Check every minute for missed heartbeats
  cron.schedule('* * * * *', async () => {
    try {
      await checkHeartbeats();
    } catch (err) {
      console.error('[nexus] heartbeat monitor error:', err);
    }
  });
  console.log('[nexus] Heartbeat monitor started (checking every minute)');
}

async function checkHeartbeats(): Promise<void> {
  const agents = await prisma.agent.findMany({ where: { isActive: true } });
  const cutoff = new Date(Date.now() - config.heartbeatIntervalSecs * 1000 * 1.5); // 1.5x interval = missed

  for (const agent of agents) {
    const latest = await prisma.heartbeat.findFirst({
      where: { agentId: agent.id },
      orderBy: { timestamp: 'desc' },
    });

    const missed = !latest || latest.timestamp < cutoff;

    if (missed) {
      const count = (missedCounts.get(agent.id) ?? 0) + 1;
      missedCounts.set(agent.id, count);

      if (count === config.heartbeatMissedAlertCount) {
        const msg = `*[Nexus Alert]* ${agent.name} (${agent.role}) has missed ${count} consecutive heartbeats. Last seen: ${latest ? latest.timestamp.toISOString() : 'never'}.`;
        await sendAlert(msg);

        // Log as incident
        await prisma.incident.create({
          data: {
            agentId: agent.id,
            type: 'process_anomaly',
            severity: 'high',
            description: `${agent.name} missed ${count} consecutive heartbeats`,
            source: agent.ip,
          },
        });

        broadcast({
          type: 'incident',
          payload: { agentId: agent.id, agentName: agent.name, type: 'missed_heartbeat', count },
        });
      }
    } else {
      // Agent is alive — reset counter
      missedCounts.set(agent.id, 0);
    }
  }
}
