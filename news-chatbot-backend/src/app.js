import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Import Redis and routes
import redisManager from "./config/redis.js";
import chatRoutes from "./routes/chat.js";
import sessionRoutes from "./routes/session.js";

dotenv.config();

const app = express();

// Initialize Redis connection
let redisConnected = false;
try {
  await redisManager.connect();
  redisConnected = true;
  console.log("✅ Connected to Redis Cloud");
} catch (error) {
  console.error("❌ Failed to connect to Redis Cloud:", error.message);
  console.warn("⚠️  Server will continue without Redis (sessions won't persist)");
  redisConnected = false;
}

// Update health check to show Redis status
app.get("/api/health", async (req, res) => {
  console.log("✅ Health endpoint hit!");

  // Check Redis connection
  let redisStatus = "disconnected";
  try {
    if (redisConnected) {
      const redis = redisManager.getClient();
      await redis.ping();
      redisStatus = "connected";
    }
  } catch (error) {
    redisStatus = "error";
  }

  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: "News Chatbot API is running",
    services: {
      redis: redisStatus,
      redisCloud: process.env.REDIS_HOST ? "configured" : "not-configured",
    },
  });
});

// Basic middleware first
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? "https://your-frontend-domain.com" : "http://localhost:5173",
    credentials: true,
  })
);

// Security middleware
app.use(helmet());

// Logging
app.use(morgan("combined"));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// API routes
app.use("/api/chat", chatRoutes);
app.use("/api/session", sessionRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Error:", err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong!" : err.message,
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 SIGTERM received, shutting down gracefully");
  await redisManager.disconnect();
  process.exit(0);
});

export default app;
