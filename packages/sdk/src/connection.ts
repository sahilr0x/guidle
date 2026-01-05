import { GuidleConfig, WSServerMessage } from "./types";

export class GuidleConnection {
  private ws: WebSocket | null = null;
  private config: GuidleConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: ((message: WSServerMessage) => void)[] = [];

  constructor(config: GuidleConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.config.serverUrl.replace(/^http/, "ws");
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("[Guidle] Connected to server");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSServerMessage = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (e) {
            console.error("[Guidle] Failed to parse message:", e);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[Guidle] WebSocket error:", error);
          this.config.onError?.(new Error("WebSocket connection error"));
        };

        this.ws.onclose = () => {
          console.log("[Guidle] Connection closed");
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`[Guidle] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }

  sendQuery(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "QUERY",
        text,
        appId: this.config.appId
      }));
    } else {
      console.warn("[Guidle] Cannot send query - not connected");
    }
  }

  registerSchema(schema: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "REGISTER_SCHEMA",
        schema
      }));
    }
  }

  onMessage(handler: (message: WSServerMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) this.messageHandlers.splice(index, 1);
    };
  }

  disconnect() {
    this.maxReconnectAttempts = 0; // Prevent reconnection
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
