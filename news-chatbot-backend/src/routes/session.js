import express from "express";
import sessionService from "../services/sessionService.js";

const router = express.Router();

// POST /api/session/create - Create new session
router.post("/create", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await sessionService.createSession(sessionId);

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        messageCount: session.messageCount,
      },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create session",
    });
  }
});

// GET /api/session/:sessionId/history - Get session history
router.get("/:sessionId/history", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await sessionService.getSessionHistory(sessionId);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error getting session history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve session history",
    });
  }
});

// DELETE /api/session/:sessionId/clear - Clear session
router.delete("/:sessionId/clear", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const cleared = await sessionService.clearSession(sessionId);

    if (cleared) {
      res.status(200).json({
        success: true,
        message: "Session cleared successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
  } catch (error) {
    console.error("Error clearing session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear session",
    });
  }
});

// GET /api/session/active - Get all active sessions (debug)
router.get("/active", async (req, res) => {
  try {
    const sessions = await sessionService.getActiveSessions();

    res.status(200).json({
      success: true,
      data: {
        activeSessions: sessions,
        count: sessions.length,
      },
    });
  } catch (error) {
    console.error("Error getting active sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve active sessions",
    });
  }
});

export default router;
