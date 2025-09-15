import redisManager from "../config/redis.js";
import crypto from "crypto";

class CacheService {
  constructor() {
    this.TTL = {
      SHORT: 300, // 5 minutes - API responses
      MEDIUM: 1800, // 30 minutes - Frequent queries
      LONG: 7200, // 2 hours - RAG responses
      SESSION: 1800, // 30 minutes - Session data
    };
  }

  // Generate cache key with namespace
  generateKey(namespace, identifier, params = {}) {
    const paramStr = Object.keys(params).length > 0 ? crypto.createHash("md5").update(JSON.stringify(params)).digest("hex") : "";
    return `${namespace}:${identifier}${paramStr ? ":" + paramStr : ""}`;
  }

  // Cache RAG responses
  async cacheRAGResponse(query, response, ttl = this.TTL.LONG) {
    try {
      const redis = redisManager.getClient();
      const key = this.generateKey("rag", crypto.createHash("md5").update(query).digest("hex"));

      const cacheData = {
        query,
        response,
        timestamp: new Date().toISOString(),
        sources: response.sources || [],
      };

      await redis.setex(key, ttl, JSON.stringify(cacheData));
      console.log(`✅ Cached RAG response for query: ${query.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error("❌ Error caching RAG response:", error);
      return false;
    }
  }

  // Get cached RAG response
  async getCachedRAGResponse(query) {
    try {
      const redis = redisManager.getClient();
      const key = this.generateKey("rag", crypto.createHash("md5").update(query).digest("hex"));

      const cached = await redis.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`🎯 Cache HIT for RAG query: ${query.substring(0, 50)}...`);
        return data;
      }

      console.log(`❌ Cache MISS for RAG query: ${query.substring(0, 50)}...`);
      return null;
    } catch (error) {
      console.error("❌ Error getting cached RAG response:", error);
      return null;
    }
  }

  // Cache API responses
  async cacheAPIResponse(endpoint, params, response, ttl = this.TTL.MEDIUM) {
    try {
      const redis = redisManager.getClient();
      const key = this.generateKey("api", endpoint, params);

      await redis.setex(
        key,
        ttl,
        JSON.stringify({
          data: response,
          timestamp: new Date().toISOString(),
        })
      );

      console.log(`✅ Cached API response for: ${endpoint}`);
      return true;
    } catch (error) {
      console.error("❌ Error caching API response:", error);
      return false;
    }
  }

  // Get cached API response
  async getCachedAPIResponse(endpoint, params = {}) {
    try {
      const redis = redisManager.getClient();
      const key = this.generateKey("api", endpoint, params);

      const cached = await redis.get(key);
      if (cached) {
        console.log(`🎯 Cache HIT for API: ${endpoint}`);
        return JSON.parse(cached);
      }

      console.log(`❌ Cache MISS for API: ${endpoint}`);
      return null;
    } catch (error) {
      console.error("❌ Error getting cached API response:", error);
      return null;
    }
  }

  // Cache warming for frequent queries
  async warmCache() {
    try {
      console.log("🔥 Starting cache warming...");

      // Warm popular queries
      const popularQueries = ["What's the latest technology news?", "Tell me about recent world events", "What's happening in business today?", "Latest breaking news"];

      // Warm session status
      const redis = redisManager.getClient();
      await redis.setex(
        "system:status",
        this.TTL.SHORT,
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
        })
      );

      console.log("✅ Cache warming completed");
      return true;
    } catch (error) {
      console.error("❌ Cache warming failed:", error);
      return false;
    }
  }

  // Invalidate cache patterns
  async invalidateCache(pattern) {
    try {
      const redis = redisManager.getClient();
      const keys = await redis.keys(`${pattern}*`);

      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️ Invalidated ${keys.length} cache keys for pattern: ${pattern}`);
      }

      return true;
    } catch (error) {
      console.error("❌ Error invalidating cache:", error);
      return false;
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const redis = redisManager.getClient();
      const info = await redis.info("memory");
      const dbsize = await redis.dbsize();

      return {
        totalKeys: dbsize,
        memoryUsage: info,
        isConnected: redisManager.isConnected,
      };
    } catch (error) {
      console.error("❌ Error getting cache stats:", error);
      return null;
    }
  }
}

const cacheService = new CacheService();
export default cacheService;
