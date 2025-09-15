import { Server } from "socket.io";
import sessionService from "./sessionService.js";
import ragService from "./ragService.js";
import cacheService from "./cacheService.js";

class SocketService {
  constructor() {
    this.io = null;
    this.activeConnections = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    console.log("✅ Socket.IO initialized for full chat handling");
    return this.io;
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`👋 User connected: ${socket.id}`);

      // ✅ Session management via Socket.io
      socket.on("join-session", async (sessionId) => {
        try {
          socket.join(sessionId);
          this.activeConnections.set(socket.id, {
            sessionId,
            connectedAt: new Date(),
          });

          // Load and send chat history
          const history = await sessionService.getSessionHistory(sessionId);
          socket.emit("session-history", history);

          console.log(`📱 Socket ${socket.id} joined session: ${sessionId}`);
        } catch (error) {
          socket.emit("error", { message: "Failed to join session" });
        }
      });

      // Handle real-time chat messages

      socket.on("chat-message", async (data) => {
        try {
          const { sessionId, message } = data;

          if (!this.activeConnections.has(socket.id)) {
            socket.emit("error", { message: "No active session" });
            return;
          }

          console.log("📝 Processing chat message via Socket.io:", { sessionId, message });

          // Validate input
          if (!message || message.trim().length === 0) {
            socket.emit("error", { message: "Empty message" });
            return;
          }

          // Add user message to session
          await sessionService.addMessage(sessionId, {
            role: "user",
            content: message,
            type: "text",
          });

          // Emit user message to room immediately
          this.io.to(sessionId).emit("message-added", {
            role: "user",
            content: message,
            timestamp: new Date().toISOString(),
          });

          // Start typing indicator
          this.io.to(sessionId).emit("bot-typing", true);

          // Check cache first
          const cachedResponse = await cacheService.getCachedRAGResponse(message);
          let ragResult;

          if (cachedResponse) {
            console.log("🎯 Using cached response");
            ragResult = cachedResponse.response;
          } else {
            console.log("🤖 Processing new RAG query");

            // Check RAG status
            const ragStatus = await ragService.getStatus();
            if (!ragStatus.initialized) {
              // Stop typing
              this.io.to(sessionId).emit("bot-typing", false);

              const fallbackResponse = "🤖 I'm still learning about the latest news! Please try again in a few minutes.";

              await sessionService.addMessage(sessionId, {
                role: "assistant",
                content: fallbackResponse,
                type: "text",
                status: "initializing",
              });

              this.io.to(sessionId).emit("message-added", {
                role: "assistant",
                content: fallbackResponse,
                timestamp: new Date().toISOString(),
                fallback: true,
              });
              return;
            }

            // Process with RAG
            ragResult = await ragService.query(message);

            // Cache the response
            await cacheService.cacheRAGResponse(message, ragResult);
          }

          // Stop typing indicator
          this.io.to(sessionId).emit("bot-typing", false);

          // Add bot response to session
          await sessionService.addMessage(sessionId, {
            role: "assistant",
            content: ragResult.answer,
            type: "text",
            sources: ragResult.sources,
            contextCount: ragResult.contextCount,
          });

          // Emit bot response
          this.io.to(sessionId).emit("message-added", {
            role: "assistant",
            content: ragResult.answer,
            sources: ragResult.sources,
            timestamp: new Date().toISOString(),
          });

          console.log("✅ Chat message processed successfully via Socket.io");
        } catch (error) {
          console.error("❌ Socket chat error:", error);

          // Stop typing on error
          if (data.sessionId) {
            this.io.to(data.sessionId).emit("bot-typing", false);
          }

          socket.emit("error", { message: "Failed to process message" });
        }
      });

      // Handle session reset
      socket.on("reset-session", async (sessionId) => {
        try {
          await sessionService.clearSession(sessionId);
          this.io.to(sessionId).emit("session-reset");
          console.log(`🔄 Session reset via Socket.io: ${sessionId}`);
        } catch (error) {
          socket.emit("error", { message: "Failed to reset session" });
        }
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          console.log(`👋 User disconnected: ${socket.id} from session: ${connection.sessionId} (${reason})`);
          this.activeConnections.delete(socket.id);
        }
      });

      // Error handling
      socket.on("error", (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });
    });
  }

  // Broadcast to all clients
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Send to specific session
  sendToSession(sessionId, event, data) {
    if (this.io) {
      this.io.to(sessionId).emit(event, data);
    }
  }

  // Get connection stats
  getStats() {
    return {
      totalConnections: this.activeConnections.size,
      activeRooms: this.io ? this.io.sockets.adapter.rooms.size : 0,
      connections: Array.from(this.activeConnections.entries()).map(([socketId, data]) => ({
        socketId,
        sessionId: data.sessionId,
        connectedAt: data.connectedAt,
      })),
    };
  }
}

const socketService = new SocketService();
export default socketService;
