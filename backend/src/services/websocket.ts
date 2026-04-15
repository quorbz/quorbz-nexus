import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WsMessage } from '../types/index.js';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.on('error', console.error);
    // Send a welcome ping
    ws.send(JSON.stringify({ type: 'connected', payload: { ts: new Date().toISOString() } }));
  });
}

export function broadcast(msg: WsMessage): void {
  if (!wss) return;
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
