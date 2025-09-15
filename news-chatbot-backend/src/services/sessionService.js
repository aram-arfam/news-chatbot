import { v4 as uuidv4 } from "uuid";
import redisManager from "../config/redis.js";

class SessionService {
  constructor() {
    this.TTL = parseInt(process.env.SESSION_TTL) || 1800; // 30 minutes default
  }

  // Generate new session ID
  generateSessionId() {
    return uuidv4();
  }

  // Create new session
  async createSession(sessionId = null) {
    try {
      const id = sessionId || this.generateSessionId();
      const redis = redisManager.getClient();

      const sessionData = {
        sessionId: id,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messageCount: 0,
        messages: [],
      };

      // Store session in Redis with TTL
      await redis.setex(`session:${id}`, this.TTL, JSON.stringify(sessionData));

      console.log(`✅ Session created: ${id}`);
      return sessionData;
    } catch (error) {
      console.error("❌ Error creating session:", error);
      throw new Error("Failed to create session");
    }
  }

  // Get existing session
  async getSession(sessionId) {
    try {
      const redis = redisManager.getClient();
      const sessionData = await redis.get(`session:${sessionId}`);

      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData);
    } catch (error) {
      console.error("❌ Error getting session:", error);
      throw new Error("Failed to retrieve session");
    }
  }

  // Update session activity and extend TTL
  async updateSessionActivity(sessionId) {
    try {
      const redis = redisManager.getClient();
      const session = await this.getSession(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      session.lastActivity = new Date().toISOString();

      // Update session with new TTL
      await redis.setex(`session:${sessionId}`, this.TTL, JSON.stringify(session));

      return session;
    } catch (error) {
      console.error("❌ Error updating session activity:", error);
      throw error;
    }
  }

  // Add message to session
  async addMessage(sessionId, message) {
    try {
      const redis = redisManager.getClient();
      let session = await this.getSession(sessionId);

      if (!session) {
        // Create new session if doesn't exist
        session = await this.createSession(sessionId);
      }

      // Add message with timestamp
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString(),
        messageId: uuidv4(),
      };

      session.messages.push(messageWithTimestamp);
      session.messageCount = session.messages.length;
      session.lastActivity = new Date().toISOString();

      // Update session in Redis
      await redis.setex(`session:${sessionId}`, this.TTL, JSON.stringify(session));

      return session;
    } catch (error) {
      console.error("❌ Error adding message to session:", error);
      throw error;
    }
  }

  // Get session history
  async getSessionHistory(sessionId) {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        return {
          sessionId,
          messages: [],
          messageCount: 0,
          exists: false,
        };
      }

      return {
        sessionId: session.sessionId,
        messages: session.messages,
        messageCount: session.messageCount,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        exists: true,
      };
    } catch (error) {
      console.error("❌ Error getting session history:", error);
      throw error;
    }
  }

  // Clear session
  async clearSession(sessionId) {
    try {
      const redis = redisManager.getClient();
      const result = await redis.del(`session:${sessionId}`);

      console.log(`🗑️ Session cleared: ${sessionId}`);
      return result > 0;
    } catch (error) {
      console.error("❌ Error clearing session:", error);
      throw error;
    }
  }

  // Get all active sessions (for debugging)
  async getActiveSessions() {
    try {
      const redis = redisManager.getClient();
      const keys = await redis.keys("session:*");
      return keys.map((key) => key.replace("session:", ""));
    } catch (error) {
      console.error("❌ Error getting active sessions:", error);
      throw error;
    }
  }
}

// Create singleton instance
const sessionService = new SessionService();
export default sessionService;
