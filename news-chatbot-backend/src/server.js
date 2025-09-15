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
app.use(cors());
app.use(express.json());

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
// Enhanced server startup with proper Qdrant connection
async function startServer() {
  try {
    console.log("🚀 Starting server initialization...");

    // Connect to Redis
    await redisManager.connect();

    // ✅ CRITICAL FIX: Connect to Qdrant with retry logic
    await connectToQdrantWithRetry();

    // ✅ CRITICAL FIX: Initialize RAG service after connection
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

// ✅ NEW: Qdrant connection with retry logic
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

// ✅ NEW: Initialize RAG service after successful connection
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

// Graceful shutdown
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
