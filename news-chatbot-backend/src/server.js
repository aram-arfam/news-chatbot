import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";

// Import services
import redisManager from "./config/redis.js";
import socketService from "./services/socketService.js";
import cacheService from "./services/cacheService.js";
import errorHandler from "./middleware/errorHandler.js";
import vectorService from "./services/vectorService.js";
import ragService from "./services/ragService.js";

// Import routes
import chatRoutes from "./routes/chat.js";
import sessionRoutes from "./routes/session.js";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.IO
const io = socketService.initialize(server);
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({
    service: "News Chatbot API",
    version: "1.0.0",
    status: "operational",
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    description: "AI-powered news chatbot backend service with RAG (Retrieval-Augmented Generation)",
    baseURL: req.protocol + "://" + req.get("host"),

    // Core API Endpoints
    endpoints: {
      // Health & Monitoring
      health: {
        method: "GET",
        path: "/api/health",
        description: "API health check and service status",
        response: "Service health metrics and dependencies status",
      },

      // Chat API
      chat: {
        method: "POST",
        path: "/api/chat",
        description: "Send user messages and get AI-powered responses",
        requires: ["sessionId", "message"],
        response: "AI-generated response with sources",
      },
      chatInfo: {
        method: "GET",
        path: "/api/chat",
        description: "Get chat API information and available endpoints",
      },
      chatStatus: {
        method: "GET",
        path: "/api/chat/status",
        description: "Get RAG pipeline status and initialization state",
      },
      chatRebuild: {
        method: "POST",
        path: "/api/chat/rebuild",
        description: "Rebuild knowledge base from latest news sources",
        note: "Takes 5-10 minutes to complete",
      },

      // Session Management
      sessionCreate: {
        method: "POST",
        path: "/api/session/create",
        description: "Create a new chat session",
        optional: ["sessionId"],
      },
      sessionInfo: {
        method: "GET",
        path: "/api/session",
        description: "Get session API information",
      },
      sessionHistory: {
        method: "GET",
        path: "/api/session/:sessionId/history",
        description: "Retrieve chat history for a specific session",
      },
      sessionClear: {
        method: "DELETE",
        path: "/api/session/:sessionId/clear",
        description: "Clear all messages from a session",
      },
      sessionActive: {
        method: "GET",
        path: "/api/session/active",
        description: "List all active sessions (debug endpoint)",
      },

      // System Management
      cacheWarm: {
        method: "GET",
        path: "/api/cache/warm",
        description: "Warm cache with popular queries",
      },
      cacheStats: {
        method: "GET",
        path: "/api/cache/stats",
        description: "Get Redis cache usage statistics",
      },
      socketStats: {
        method: "GET",
        path: "/api/socket/stats",
        description: "Get WebSocket connection statistics",
      },

      // Vector Database Management
      recreateCollection: {
        method: "POST",
        path: "/api/chat/recreate-collection",
        description: "Recreate Qdrant vector collection",
      },
      clearCollection: {
        method: "DELETE",
        path: "/api/chat/collection",
        description: "Clear all vectors from knowledge base",
      },
    },

    // Technology Stack
    stack: {
      runtime: "Node.js",
      framework: "Express.js",
      ai: "Google Gemini + Jina Embeddings",
      vectorDB: "Qdrant Cloud",
      cache: "Redis Cloud",
      realtime: "Socket.IO",
    },

    // Usage Examples
    examples: {
      healthCheck: "GET /api/health",
      createSession: 'POST /api/session/create {"sessionId": "optional-id"}',
      sendMessage: 'POST /api/chat {"sessionId": "your-session", "message": "What\'s the latest tech news?"}',
      getHistory: "GET /api/session/your-session-id/history",
    },

    // Quick Start
    quickStart: ["1. Check health: GET /api/health", "2. Create session: POST /api/session/create", "3. Send message: POST /api/chat with sessionId and message", "4. View history: GET /api/session/{sessionId}/history"],

    // Support Information
    support: {
      documentation: "Available at root endpoint (/)",
      webSocketSupport: true,
      rateLimiting: "100 requests per 15 minutes per IP",
      cors: "Enabled for localhost:5173",
    },
  });
});

// Rate limiting
app.use("/api/chat", (req, res, next) => {
  errorHandler.rateLimitHandler(req, res, next, { windowMs: 60000, max: 10 });
});

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/session", sessionRoutes);

// Health check
app.get("/api/health", errorHandler.healthCheck);

// Cache warming on startup
app.get(
  "/api/cache/warm",
  errorHandler.asyncHandler(async (req, res) => {
    const result = await cacheService.warmCache();
    res.json({ success: result, message: "Cache warming initiated" });
  })
);

// Cache stats endpoint
app.get(
  "/api/cache/stats",
  errorHandler.asyncHandler(async (req, res) => {
    const stats = await cacheService.getCacheStats();
    res.json({ success: true, data: stats });
  })
);

// Socket stats endpoint
app.get("/api/socket/stats", (req, res) => {
  const stats = socketService.getStats();
  res.json({ success: true, data: stats });
});

// Error handling
app.use(errorHandler.notFoundHandler);
app.use(errorHandler.handleError);

// Initialize services
async function startServer() {
  try {
    console.log("🚀 Starting server initialization...");

    // Connect to Redis
    await redisManager.connect();

    // Connect to Qdrant with retry logic
    await connectToQdrantWithRetry();

    // Initialize RAG service after connection
    await initializeRAGService();

    // Warm cache
    await cacheService.warmCache();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`✅ All services initialized successfully`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Qdrant connection with retry logic
async function connectToQdrantWithRetry() {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`🔌 Connecting to Qdrant (attempt ${attempt + 1}/${maxRetries})...`);

      // Force reconnection
      await vectorService.connect();

      // Verify connection by getting collection info
      const collectionInfo = await vectorService.getCollectionInfo();
      console.log(`✅ Qdrant connected! Collection has ${collectionInfo.points_count || 0} points`);

      return; // Success, exit retry loop
    } catch (error) {
      attempt++;
      console.error(`❌ Qdrant connection attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.min(attempt * 2000, 10000); // Exponential backoff, max 10s
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed to connect to Qdrant after ${maxRetries} attempts`);
      }
    }
  }
}

// Initialize RAG service after successful connection
async function initializeRAGService() {
  try {
    console.log("🧠 Initializing RAG service...");

    // Check if we have data
    const status = await ragService.getStatus();
    console.log("📊 RAG Status:", status);

    if (status.vectorDatabase.connected && status.vectorDatabase.pointsCount > 0) {
      console.log(`✅ RAG service ready with ${status.vectorDatabase.pointsCount} embeddings`);
      // Manually set initialized flag since data exists
      ragService.isInitialized = true;
    } else {
      console.log("⚠️ No data found, RAG service not initialized");
      console.log("💡 Use POST /api/chat/rebuild to build knowledge base");
    }
  } catch (error) {
    console.error("❌ Failed to initialize RAG service:", error);
    throw error;
  }
}

// Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  await redisManager.disconnect();
  server.close(() => {
    console.log("👋 Server closed");
    process.exit(0);
  });
});

startServer();

export { app, server, io };
