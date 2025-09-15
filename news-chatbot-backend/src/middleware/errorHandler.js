import fs from "fs/promises";
import path from "path";

class ErrorHandler {
  constructor() {
    this.logDir = "./logs";
    this.initializeLogging();
  }

  async initializeLogging() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create logs directory:", error);
    }
  }

  // Log error to file
  async logError(error, req = null, additional = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      request: req
        ? {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
            ip: req.ip,
            userAgent: req.get("user-agent"),
          }
        : null,
      ...additional,
    };

    try {
      const logFile = path.join(this.logDir, `error-${new Date().toISOString().split("T")[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + "\n");
    } catch (logErr) {
      console.error("Failed to write error log:", logErr);
    }
  }

  // API Rate Limiting Error
  rateLimitHandler = (req, res, next, { windowMs, max }) => {
    const clientId = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const clientRequests = this.rateLimitStore.get(clientId) || [];
    const validRequests = clientRequests.filter((time) => time > windowStart);

    if (validRequests.length >= max) {
      const error = new Error("Too many requests");
      error.status = 429;
      error.retryAfter = Math.ceil(windowMs / 1000);

      this.logError(error, req, {
        rateLimitExceeded: true,
        requestCount: validRequests.length,
        windowMs,
        max,
      });

      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
        retryAfter: error.retryAfter,
      });
    }

    validRequests.push(now);
    this.rateLimitStore.set(clientId, validRequests);
    next();
  };

  // Async error wrapper
  asyncHandler = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Custom error class
  createError(message, statusCode = 500, type = "INTERNAL_ERROR") {
    const error = new Error(message);
    error.status = statusCode;
    error.type = type;
    return error;
  }

  // Main error handling middleware
  handleError = async (err, req, res, next) => {
    // Log the error
    await this.logError(err, req);

    // Default error values
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors)
        .map((val) => val.message)
        .join(", ");
      error = this.createError(message, 400, "VALIDATION_ERROR");
    }

    if (err.code === 11000) {
      const message = "Duplicate field value entered";
      error = this.createError(message, 400, "DUPLICATE_ERROR");
    }

    if (err.name === "JsonWebTokenError") {
      const message = "Invalid token";
      error = this.createError(message, 401, "TOKEN_ERROR");
    }

    if (err.name === "TokenExpiredError") {
      const message = "Token expired";
      error = this.createError(message, 401, "TOKEN_EXPIRED");
    }

    // RAG-specific errors
    if (err.message.includes("Jina") || err.message.includes("embedding")) {
      error = this.createError("AI service temporarily unavailable", 503, "AI_SERVICE_ERROR");
    }

    if (err.message.includes("Qdrant") || err.message.includes("vector")) {
      error = this.createError("Search service temporarily unavailable", 503, "SEARCH_SERVICE_ERROR");
    }

    if (err.message.includes("Redis")) {
      error = this.createError("Session service temporarily unavailable", 503, "SESSION_SERVICE_ERROR");
    }

    // Prepare error response
    const errorResponse = {
      success: false,
      error: error.type || "INTERNAL_ERROR",
      message: error.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
        details: err,
      }),
    };

    // Handle specific status codes
    const statusCode = error.status || 500;

    // Graceful degradation for service errors
    if ([503, 502, 504].includes(statusCode)) {
      errorResponse.fallback = {
        message: "We're experiencing technical difficulties. Please try again in a few moments.",
        retryAfter: 30,
      };
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
  };

  // 404 handler
  notFoundHandler = (req, res, next) => {
    const error = this.createError(`Route ${req.originalUrl} not found`, 404, "NOT_FOUND");
    next(error);
  };

  // Health check with error monitoring
  healthCheck = async (req, res) => {
    try {
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          redis: false,
          qdrant: false,
          ai: false,
        },
        errors: {
          recent: await this.getRecentErrors(),
          count24h: await this.getErrorCount(24),
        },
      };

      // Check services
      try {
        // Check Redis
        const redisManager = (await import("../config/redis.js")).default;
        health.services.redis = redisManager.isConnected;
      } catch (e) {
        health.services.redis = false;
      }

      // Overall status
      const allServicesHealthy = Object.values(health.services).every((status) => status);
      health.status = allServicesHealthy ? "healthy" : "degraded";

      const statusCode = health.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: error.message,
      });
    }
  };

  // Get recent errors for monitoring
  async getRecentErrors(hours = 1) {
    try {
      const logFile = path.join(this.logDir, `error-${new Date().toISOString().split("T")[0]}.log`);
      const logs = await fs.readFile(logFile, "utf-8");
      const lines = logs
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

      return lines
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((log) => log && new Date(log.timestamp) > cutoff)
        .slice(-10); // Last 10 errors
    } catch {
      return [];
    }
  }

  async getErrorCount(hours = 24) {
    const recentErrors = await this.getRecentErrors(hours);
    return recentErrors.length;
  }
}

const errorHandler = new ErrorHandler();
export default errorHandler;
