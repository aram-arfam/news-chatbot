import express from "express";
import sessionService from "../services/sessionService.js";
import ragService from "../services/ragService.js";
import vectorService from "../services/vectorService.js";
import { validateMessage } from "../middleware/validation.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Chat API is running",
    note: "Use POST to send messages",
    endpoints: {
      "POST /": "Send chat messages",
      "GET /status": "Check RAG pipeline status",
      "POST /rebuild": "Rebuild knowledge base",
    },
  });
});

// POST /api/chat - Send message and get RAG response
router.post("/", validateMessage, async (req, res) => {
  try {
    const { sessionId, message, userMessage } = req.body;
    const messageText = message || userMessage;

    const io = req.app.get("io");
    if (!io) {
      console.error("❌ ERROR: Socket.IO instance not found on app!");
      return res.status(500).json({
        success: false,
        message: "Real-time service unavailable",
      });
    }

    console.log("📝 Chat request received:", { sessionId, message: messageText });

    // ✅ Enhanced input validation
    if (!sessionId || !messageText || messageText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Session ID and non-empty message are required",
      });
    }

    // ✅ Handle very short messages gracefully
    if (messageText.trim().length < 2) {
      const shortMessageResponse = "Hi there! I'm your news assistant. Please ask me about the latest news or current events!";

      await sessionService.addMessage(sessionId, {
        role: "user",
        content: messageText,
        type: "text",
      });

      const updatedSession = await sessionService.addMessage(sessionId, {
        role: "assistant",
        content: shortMessageResponse,
        type: "text",
        fallback: true,
      });

      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          userMessage: messageText,
          botResponse: shortMessageResponse,
          messageCount: updatedSession.messageCount,
          timestamp: new Date().toISOString(),
          fallback: true,
        },
      });
    }

    // Add user message to session
    await sessionService.addMessage(sessionId, {
      role: "user",
      content: messageText,
      type: "text",
    });

    if (io && sessionId) {
      io.to(sessionId).emit("bot-typing", true);
    } else {
      console.error("❌ ERROR: Cannot emit - io:", !!io, "sessionId:", !!sessionId);
    }

    // Check if RAG is initialized
    console.log("🔍 Checking RAG service status...");

    const ragStatus = await ragService.getStatus();
    console.log("📊 RAG Status:", ragStatus);

    if (!ragStatus.initialized) {
      // ✅ Stop typing for fallback response
      if (io) {
        io.to(sessionId).emit("bot-typing", false);
        console.log("🛑 Stopped typing indicator (RAG not ready)");
      }

      // RAG not ready - return helpful message
      const fallbackResponse =
        "🤖 I'm still learning about the latest news! My knowledge base is being built right now (takes 5-10 minutes). Please try again in a few minutes, and I'll be able to give you intelligent news-based responses!";

      const updatedSession = await sessionService.addMessage(sessionId, {
        role: "assistant",
        content: fallbackResponse,
        type: "text",
        status: "initializing",
      });

      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          userMessage: messageText,
          botResponse: fallbackResponse,
          status: "rag_initializing",
          messageCount: updatedSession.messageCount,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // ✅ Process RAG query (typing indicator already started)
    console.log(`🤖 Processing RAG query: ${messageText}`);
    const ragResult = await ragService.query(messageText);
    console.log("✅ RAG query completed");

    // ✅ EMIT TYPING STOP - This was also missing!
    if (io) {
      io.to(sessionId).emit("bot-typing", false);
      console.log("🛑 Stopped typing indicator (response ready)");
    }

    // Add bot response to session
    console.log("💾 Adding bot response to session...");
    const updatedSession = await sessionService.addMessage(sessionId, {
      role: "assistant",
      content: ragResult.answer,
      type: "text",
      sources: ragResult.sources,
      contextCount: ragResult.contextCount,
    });

    console.log("✅ Chat request completed successfully");

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        userMessage: messageText,
        botResponse: ragResult.answer,
        sources: ragResult.sources,
        messageCount: updatedSession.messageCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error processing chat message:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.response?.data) {
      console.error("API Error response:", error.response.data);
    }

    // ✅ Stop typing on error too!
    const io = req.app.get("io");
    if (io && req.body.sessionId) {
      io.to(req.body.sessionId).emit("bot-typing", false);
      console.log("🛑 Stopped typing indicator (error occurred)");
    }

    res.status(500).json({
      success: false,
      message: "Failed to process chat message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/chat/status - RAG pipeline status
router.get("/status", async (req, res) => {
  try {
    const status = await ragService.getStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error getting RAG status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pipeline status",
    });
  }
});

// POST /api/chat/rebuild - Rebuild knowledge base
router.post("/rebuild", async (req, res) => {
  try {
    // Respond immediately, then process in background
    res.status(202).json({
      success: true,
      message: "Knowledge base rebuild started",
      note: "This will take 5-10 minutes. Check /api/chat/status for progress.",
      estimatedTime: "5-10 minutes",
    });

    // Start rebuild process in background
    console.log("🔄 Starting knowledge base rebuild in background...");

    setTimeout(async () => {
      try {
        await ragService.buildKnowledgeBase();
        console.log("✅ Knowledge base rebuild completed successfully!");
      } catch (error) {
        console.error("❌ Knowledge base rebuild failed:", error);
      }
    }, 100);
  } catch (error) {
    console.error("Error starting rebuild:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start knowledge base rebuild",
    });
  }
});

// POST /api/chat/recreate-collection - Recreate collection for new dimensions
router.post("/recreate-collection", async (req, res) => {
  try {
    await vectorService.recreateCollection();

    res.status(200).json({
      success: true,
      message: "Collection recreated successfully",
    });
  } catch (error) {
    console.error("Error recreating collection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to recreate collection",
    });
  }
});

// DELETE /api/chat/collection - Clear the Qdrant collection
router.delete("/collection", async (req, res) => {
  try {
    console.log("🗑️ Received request to clear collection...");
    const success = await vectorService.clearCollection();

    if (success) {
      res.status(200).json({
        success: true,
        message: "Vector collection cleared successfully.",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "The clear collection operation failed without throwing an error.",
      });
    }
  } catch (error) {
    console.error("❌ Error clearing collection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear vector collection.",
      error: error.message,
    });
  }
});

export default router;
