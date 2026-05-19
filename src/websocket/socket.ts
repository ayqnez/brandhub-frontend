'use client';

import { WS_EVENTS } from './events';

type Listener = (payload: any) => void;
type StatusListener = (connected: boolean) => void;

function resolveWsUrl(token: string) {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return `${explicit.replace(/\/$/, '')}?token=${encodeURIComponent(token)}`;

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const base = api.replace(/\/api\/?$/, '').replace(/^http/, 'ws');
  return `${base}?token=${encodeURIComponent(token)}`;
}

class SocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private statusListeners: Set<StatusListener> = new Set();
  private token: string | null = null;
  private manualDisconnect = false;

  connect(token: string) {
    if (this.socket?.readyState === WebSocket.OPEN && this.token === token) return;
    this.token = token;
    this.manualDisconnect = false;

    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
    }

    this.socket = new WebSocket(resolveWsUrl(token));

    this.socket.onopen = () => {
      this.emitStatus(true);
      this.startPing();
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.listeners.get(message.type)?.forEach((callback) => callback(message.payload));
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    this.socket.onclose = () => {
      this.emitStatus(false);
      this.stopPing();
      if (!this.manualDisconnect) this.reconnect();
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      this.emitStatus(false);
    };
  }

  private reconnect() {
    if (!this.token) return;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => this.connect(this.token!), 3000);
  }

  disconnect() {
    this.manualDisconnect = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.stopPing();
    this.socket?.close();
    this.socket = null;
    this.emitStatus(false);
  }

  send(type: string, payload?: any) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type, payload }));
  }

  on(event: string, callback: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Listener) {
    this.listeners.get(event)?.delete(callback);
  }

  onStatus(callback: StatusListener) {
    this.statusListeners.add(callback);
    callback(this.socket?.readyState === WebSocket.OPEN);
  }

  offStatus(callback: StatusListener) {
    this.statusListeners.delete(callback);
  }

  private emitStatus(connected: boolean) {
    this.statusListeners.forEach((callback) => callback(connected));
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => this.send(WS_EVENTS.PING), 30000);
  }

  private stopPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }
}

export const socketClient = new SocketClient();
