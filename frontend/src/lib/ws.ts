type WsHandler = (msg: { type: string; payload: unknown }) => void;
const handlers: WsHandler[] = [];
let ws: WebSocket | null = null;

export function connectWs(): void {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handlers.forEach((h) => h(msg));
    } catch {}
  };

  ws.onclose = () => {
    // Reconnect after 5s
    setTimeout(connectWs, 5000);
  };
}

export function onWsMessage(handler: WsHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  };
}
