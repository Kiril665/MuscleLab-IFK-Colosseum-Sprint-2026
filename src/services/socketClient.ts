/**
 * ForgeMuscle Unified WebSocket Client
 * Single connection for Battle, Chat, Voice signaling, and Presence.
 * Features: Auto-reconnect with exponential backoff, Heartbeat ping/pong,
 * Offline message queuing, Typed event subscriptions, and connection status observables.
 */

export type SocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
export type SocketEventHandler = (payload: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private status: SocketStatus = 'disconnected';
  private listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private statusListeners: Set<(status: SocketStatus) => void> = new Set();
  private messageQueue: string[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isExplicitlyClosed = false;

  constructor() {
    // Auto-connect if in browser environment
    if (typeof window !== 'undefined') {
      // Connect after short tick to allow session cookies to settle
      setTimeout(() => this.connect(), 100);
    }
  }

  public getStatus(): SocketStatus {
    return this.status;
  }

  public subscribeStatus(listener: (status: SocketStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(newStatus: SocketStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') return; // Heartbeat response
          
          const handlers = this.listeners.get(data.type);
          if (handlers && handlers.size > 0) {
            handlers.forEach((handler) => {
              try {
                handler(data);
              } catch (e) {
                console.error(`[WS Handler Error: ${data.type}]`, e);
              }
            });
          }

          // Also trigger wildcard handler if registered
          const wildcard = this.listeners.get('*');
          if (wildcard) {
            wildcard.forEach((handler) => handler(data));
          }
        } catch (err) {
          console.warn('[WS Parse Warning]', err);
        }
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.ws = null;

        if (!this.isExplicitlyClosed) {
          this.setStatus('disconnected');
          this.scheduleReconnect();
        } else {
          this.setStatus('disconnected');
        }
      };

      this.ws.onerror = () => {
        // Handled in onclose
      };
    } catch {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitlyClosed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
      this.setStatus('reconnecting');
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.setStatus('disconnected');
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) {
        this.ws.send(msg);
      }
    }
  }

  public send(type: string, payload: Record<string, any> = {}) {
    const message = JSON.stringify({ type, ...payload, _ts: Date.now() });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Battle rep events are time-sensitive and must never be replayed after reconnect.
      // Queue only idempotent/non-authoritative messages.
      if (type !== 'battle_rep' && type !== 'battle_join_queue' && this.messageQueue.length < 50) {
        this.messageQueue.push(message);
      }
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) this.connect();
    }
  }

  public on(type: string, handler: SocketEventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  public off(type: string, handler: SocketEventHandler) {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}

export const socketClient = new SocketClient();
