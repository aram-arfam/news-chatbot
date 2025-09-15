import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Redis Cloud configuration
      const redisConfig = {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        username: process.env.REDIS_USERNAME || undefined,

        // Redis Cloud typically requires TLS
        tls: process.env.REDIS_HOST && process.env.REDIS_HOST.includes("redislabs.com") ? {} : undefined,

        // Connection options for cloud
        connectTimeout: 10000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,

        // Handle connection issues gracefully
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      };

      console.log(`🔌 Connecting to Redis Cloud at ${redisConfig.host}:${redisConfig.port}`);

      this.client = new Redis(redisConfig);

      // Event listeners
      this.client.on("connect", () => {
        console.log("🔌 Redis Cloud connected successfully");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        console.log("✅ Redis Cloud is ready to accept commands");
      });

      this.client.on("error", (err) => {
        console.error("❌ Redis Cloud connection error:", err.message);
        this.isConnected = false;
      });

      this.client.on("close", () => {
        console.log("🔌 Redis Cloud connection closed");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        console.log("🔄 Reconnecting to Redis Cloud...");
      });

      // Test connection
      await this.client.ping();
      console.log("✅ Redis Cloud connection test successful");
    } catch (error) {
      console.error("❌ Failed to connect to Redis Cloud:", error.message);
      console.error("💡 Check your Redis Cloud credentials in .env file");
      throw error;
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis Cloud client not connected");
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log("👋 Disconnected from Redis Cloud");
    }
  }
}

// Create singleton instance
const redisManager = new RedisManager();
export default redisManager;
