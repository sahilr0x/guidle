import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { handleSession } from "./ws/session.ws";

export function createServer(port: number) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "guidle-backend" });
  });

  // API info endpoint
  app.get("/api/info", (req, res) => {
    res.json({
      name: "Guidle API",
      version: "1.0.0",
      description: "AI-powered UI guidance system",
      wsEndpoint: `ws://localhost:${port}`
    });
  });

  const server = app.listen(port, () => {
    console.log(`[Guidle] Server running on port ${port}`);
    console.log(`[Guidle] WebSocket endpoint: ws://localhost:${port}`);
  });

  // WebSocket server for real-time guidance
  const wss = new WebSocketServer({ server });
  
  wss.on("connection", (ws, req) => {
    console.log(`[Guidle] WebSocket connection from: ${req.socket.remoteAddress}`);
    handleSession(ws);
  });

  return { app, server, wss };
}