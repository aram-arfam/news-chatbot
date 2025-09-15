# 🚪 /src/routes - The API Gateway

Welcome to the **front desk of your application**! Think of routes as the **reception area of a busy hotel** - they greet every visitor, understand what they need, and direct them to exactly the right place. Every API call starts its journey here.

## 📁 What Lives Here

routes/
├── 💬 chat.js # Chat & RAG conversation endpoints
└── 🎭 session.js # Session management endpoints

## 🗺️ The Route Map

### 💬 `chat.js` - The Conversation Hub

_"The smart receptionist who handles all your news questions"_

This is where the magic of conversation happens - where user messages transform into intelligent, context-aware responses powered by AI.

#### 🎯 Core Endpoints

| Endpoint                        | Method | Purpose                        | Example           |
| ------------------------------- | ------ | ------------------------------ | ----------------- |
| `/api/chat`                     | POST   | Send message & get AI response | Chat with the bot |
| `/api/chat/status`              | GET    | Check RAG pipeline health      | Is the AI ready?  |
| `/api/chat/rebuild`             | POST   | Rebuild knowledge base         | Refresh news data |
| `/api/chat/recreate-collection` | POST   | Reset vector database          | Fresh start       |
| `/api/chat/collection`          | DELETE | Clear embeddings               | Emergency reset   |

#### 💡 Real-World Usage Examples

**Basic Chat Conversation:**
// Send a message to the bot
POST /api/chat
{
"sessionId": "user123-session",
"message": "What's the latest tech news?"
}

// Response with AI-generated answer
{
"success": true,
"data": {
"sessionId": "user123-session",
"userMessage": "What's the latest tech news?",
"botResponse": "Here are the latest tech developments...",
"sources": [
{
"title": "AI Breakthrough in 2024",
"source": "techcrunch.com",
"score": 0.92 } ],
"messageCount": 3, "timestamp": "2024-01-15T14:30:22.123Z"
} }

**Check System Status:**
// Is the AI ready to answer questions?
GET /api/chat/status

{
"success": true,
"data": {
"initialized": true,
"vectorDatabase": {
"connected": true,
"pointsCount": 1247,
"collection": "news_articles"
},
"services": {
"gemini": true,
"jina": true,
"qdrant": true
}
}
}

#### 🤖 Smart Features

**1. Real-Time Typing Indicators**
// When user sends message:

📝 Store user message in session

📡 Emit "bot-typing: true" via Socket.IO

🧠 Process with AI

📡 Emit "bot-typing: false"

💬 Send response

**2. Graceful Degradation**
// If AI isn't ready yet:
if (!ragStatus.initialized) {
return "🤖 I'm still learning about the latest news! " +
"Please try again in a few minutes.";
}

**3. Smart Query Handling**
// Handles various input types:

"What's happening today?" → General news

"Tell me about Tesla" → Company-specific news

"AI developments" → Technology category

"hi" → Friendly greeting response

### 🎭 `session.js` - The Memory Keeper

_"The personal assistant who remembers every conversation"_

Manages chat sessions and conversation history - ensuring every user gets a personalized, continuous experience.

#### 🎯 Core Endpoints

| Endpoint                   | Method | Purpose                  | Example            |
| -------------------------- | ------ | ------------------------ | ------------------ |
| `/api/session/create`      | POST   | Start new conversation   | Begin chatting     |
| `/api/session/:id/history` | GET    | Get conversation history | View past messages |
| `/api/session/:id/clear`   | DELETE | Reset conversation       | Fresh start        |
| `/api/session/active`      | GET    | List active sessions     | Admin monitoring   |

#### 💡 Session Lifecycle Examples

**Creating a New Session:**
POST /api/session/create
{
"sessionId": "optional-custom-id" // Auto-generated if not provided
}

{
"success": true,
"data": {
"sessionId": "550e8400-e29b-41d4-a716-446655440000",
"createdAt": "2024-01-15T14:30:22.123Z",
"messageCount": 0
}
}

**Retrieving Chat History:**
GET /api/session/user123-session/history

{
"success": true,
"data": {
"sessionId": "user123-session",
"messages": [
{
"role": "user",
"content": "Hello!",
"timestamp": "2024-01-15T14:25:00.000Z",
"messageId": "msg-001"
},
{
"role": "assistant",
"content": "Hi! I'm your news assistant...",
"timestamp": "2024-01-15T14:25:01.000Z",
"messageId": "msg-002"
}
],
"messageCount": 2,
"createdAt": "2024-01-15T14:25:00.000Z",
"lastActivity": "2024-01-15T14:25:01.000Z"
}
}

## 🔄 Request Flow Architecture

### Chat Message Journey

🚪 Route receives request
↓

✅ Validate input (sessionId, message)
↓

💾 Store user message in session
↓

📡 Start typing indicator (Socket.IO)
↓

🧠 Process with RAG service
↓

💾 Store AI response in session
↓

📡 Stop typing indicator
↓

📤 Return formatted response

### Error Handling Flow

❌ Error occurs
↓
🛡️ Middleware catches error
↓
📝 Log error details
↓
📡 Stop typing indicator (if active)
↓
🔄 Return graceful error response

## 🛠️ Advanced Features

### Socket.IO Integration

// Access Socket.IO instance in routes
const io = req.app.get("io");

// Real-time features:
io.to(sessionId).emit("bot-typing", true);
io.to(sessionId).emit("message-added", messageData);
io.to(sessionId).emit("session-reset");

### Input Validation & Sanitization

// Comprehensive input validation
if (!sessionId || !messageText || messageText.trim().length === 0) {
return res.status(400).json({
success: false,
message: "Session ID and non-empty message are required"
});
}

// Handle edge cases
if (messageText.trim().length < 2) {
// Provide helpful response for very short inputs
return "Please ask me about specific news topics!";
}

### Background Processing

// Long-running operations don't block responses
router.post("/rebuild", async (req, res) => {
// Respond immediately
res.status(202).json({
success: true,
message: "Knowledge base rebuild started",
estimatedTime: "5-10 minutes"
});

// Process in background
setTimeout(async () => {
await ragService.buildKnowledgeBase();
}, 100);
});

## 🎯 Best Practices

### 1. Input Validation First

// ✅ Always validate before processing
if (!req.body.message || req.body.message.trim().length === 0) {
return res.status(400).json({
success: false,
message: "Message is required"
});
}

### 2. Consistent Response Format

// ✅ Standardized response structure
const successResponse = {
success: true,
data: {
sessionId,
userMessage,
botResponse,
timestamp: new Date().toISOString()
}
};

const errorResponse = {
success: false,
message: "Error description",
error: "ERROR_CODE"
};

### 3. Resource Cleanup

// ✅ Always stop typing indicators on error
try {
// ... process message
} catch (error) {
if (io && sessionId) {
io.to(sessionId).emit("bot-typing", false);
}
throw error;
}

## 🐛 Common Issues & Solutions

### Session Not Found

// Problem: User references non-existent session
// Solution: Auto-create session if missing
let session = await sessionService.getSession(sessionId);
if (!session) {
session = await sessionService.createSession(sessionId);
}

### Rate Limiting

// Problem: Too many requests
// Solution: Implement per-endpoint limits
app.use('/api/chat', rateLimiter({
windowMs: 60000, // 1 minute
max: 10 // 10 messages per minute
}));

### Long Response Times

// Problem: AI processing takes time
// Solution: Immediate acknowledgment + real-time updates
res.status(200).json({ success: true, processing: true });
// Continue processing in background with Socket.IO updates

## 📚 Related Documentation

- [Services Documentation](../services/README.md) - Business logic details
- [Socket.IO Integration](../services/socketService.js) - Real-time features
- [Error Handling](../middleware/README.md) - Error management

---

_Remember: Great routes are like a well-organized reception desk - users get exactly what they need, quickly and efficiently!_ 🏨
