# 🛡️ /src/middleware - The Guardian Layer

Welcome to the **middleware fortress**! Think of middleware as the **security checkpoint, traffic controller, and customer service desk** all rolled into one. Every request that comes into your application must pass through these guardians first.

## 📁 What Lives Here

middleware/
└── 🚨 errorHandler.js # Comprehensive error management system

## 🛡️ The Guardian: `errorHandler.js`

_"The Swiss Army knife of error management - handles everything from traffic jams to system crashes"_

This isn't just an error handler; it's a complete **request protection and monitoring system** that ensures your application runs smoothly and fails gracefully when things go wrong.

## 🎯 Core Responsibilities

### 1. 🚨 Error Handling & Logging

_"The incident reporter who documents everything"_

## 🛡️ The Guardian: `errorHandler.js`

_"The Swiss Army knife of error management - handles everything from traffic jams to system crashes"_

This isn't just an error handler; it's a complete **request protection and monitoring system** that ensures your application runs smoothly and fails gracefully when things go wrong.

## 🎯 Core Responsibilities

### 1. 🚨 Error Handling & Logging

_"The incident reporter who documents everything"_

/ Captures and logs detailed error information
await this.logError(error, req, {
requestId: req.id,
userAgent: req.get('user-agent'),
timestamp: new Date().toISOString()
});

**What it logs:**

- 📝 Error messages and stack traces
- 🌐 Request details (method, URL, headers, body)
- 👤 User information (IP, user agent)
- ⏰ Precise timestamps
- 🔍 Additional context data

### 2. 🚦 Rate Limiting Protection

_"The bouncer who prevents overcrowding"_

// Prevents API abuse and ensures fair usage
rateLimitHandler(req, res, next, { windowMs: 60000, max: 10 })

**Protection features:**

- ⏱️ **Time-based windows** (e.g., 10 requests per minute)
- 🔒 **Per-IP tracking** to prevent individual abuse
- ⚡ **Fast response** for exceeded limits
- 📊 **Usage analytics** for monitoring patterns

### 3. 🎭 Graceful Error Classification

_"The translator who speaks human language"_

Converts technical errors into user-friendly messages:

// Before: "ValidationError: Path email is required"
// After: "Email address is required"

// Before: "JsonWebTokenError: invalid signature"
// After: "Your session has expired, please log in again"

**Error types handled:**

- 🔐 **Authentication errors** → Clear login prompts
- ✅ **Validation errors** → Specific field feedback
- 🔄 **Service errors** → Friendly retry messages
- 💥 **System errors** → Safe fallback responses

### 4. 🏥 Health Monitoring

_"The doctor who checks the vital signs"_

// Real-time system health reporting
const health = {
status: "healthy",
services: {
redis: redisManager.isConnected,
qdrant: vectorService.isConnected,
ai: ragService.isInitialized
},
errors: { recent: await this.getRecentErrors(), count24h: await this.getErrorCount(24) }
};

## 🔧 Key Features Breakdown

### Async Error Wrapper

_"The safety net for asynchronous operations"_

// Wraps async route handlers to catch Promise rejections
const asyncHandler = (fn) => {
return (req, res, next) => {
Promise.resolve(fn(req, res, next)).catch(next);
};
};

// Usage in routes:
app.get('/api/news', asyncHandler(async (req, res) => {
const news = await newsService.getLatest(); // Any error here gets caught!
res.json(news);
}));

### Service-Specific Error Handling

_"The specialist who knows each service's quirks"_

// RAG service errors
if (err.message.includes("Jina") || err.message.includes("embedding")) {
return "AI service temporarily unavailable - please try again in a moment";
}

// Vector database errors
if (err.message.includes("Qdrant") || err.message.includes("vector")) {
return "Search service temporarily unavailable - please try again in a moment";
}

### Development vs Production Modes

_"The information gatekeeper"_

const errorResponse = {
success: false,
message: error.message,
// 🔍 Development: Show full details
...(process.env.NODE_ENV === "development" && {
stack: err.stack,
details: err
})
// 🔒 Production: Hide sensitive information
};

## 🛠️ Usage Examples

### In Route Handlers

// Automatic error handling
app.post('/api/chat', errorHandler.asyncHandler(async (req, res) => {
const result = await chatService.processMessage(req.body.message);
res.json(result);
}));

// Manual error creation
app.get('/api/admin', (req, res, next) => {
if (!req.user.isAdmin) {
const error = errorHandler.createError(
"Access denied",
403,
"FORBIDDEN"
);
return next(error);
}
// ... admin logic
});

### Rate Limiting Setup

// Chat endpoint: 10 messages per minute
app.use('/api/chat', (req, res, next) => {
errorHandler.rateLimitHandler(req, res, next, {
windowMs: 60000, // 1 minute
max: 10 // 10 requests
});
});

// Health check: 60 requests per minute (more lenient)
app.use('/api/health', (req, res, next) => {
errorHandler.rateLimitHandler(req, res, next, {
windowMs: 60000,
max: 60
});
});

## 📊 Error Monitoring & Analytics

### Log File Structure

logs/
├── error-2024-01-15.log # Daily error logs
├── error-2024-01-16.log
└── error-2024-01-17.log

### Sample Log Entry

{
"timestamp": "2024-01-15T14:30:22.123Z",
"error": {"message": "AI service timeout","stack": "...","name": "TimeoutError"},
"request": {"method": "POST","url": "/api/chat","ip": "192.168.1.100","userAgent": "Mozilla/5.0..."},
"additionalContext": {"sessionId": "abc123", "messageLength": 45}
}

## 🚀 Best Practices

### 1. Always Use AsyncHandler

// ✅ Good: Errors are automatically caught
app.get('/api/data', errorHandler.asyncHandler(async (req, res) => {
const data = await database.getData();
res.json(data);
}));

// ❌ Bad: Unhandled promise rejections
app.get('/api/data', async (req, res) => {
const data = await database.getData(); // If this fails, app crashes!
res.json(data);
});

### 2. Create Meaningful Errors

// ✅ Good: Specific, actionable error
throw errorHandler.createError(
"Email address is already registered",
409,
"DUPLICATE_EMAIL"
);

// ❌ Bad: Generic, unhelpful error
throw new Error("Something went wrong");

### 3. Log with Context

// ✅ Good: Rich context for debugging
await errorHandler.logError(error, req, {
userId: req.user?.id,
operation: 'news_search',
queryComplexity: 'high'
});

// ❌ Bad: Just the error message
console.error(error.message);

## 🐛 Troubleshooting

### High Error Rates

Check the health endpoint for service status:
curl http://localhost:3001/api/health

### Rate Limiting Issues

Monitor rate limit violations in logs:
grep "rate limit" logs/error-$(date +%Y-%m-%d).log

### Service Degradation

Use graceful fallback responses:
// Service unavailable but app still works
if (aiServiceDown) {
return "I'm having trouble with my AI brain right now. Please try again in a few minutes!";
}

---

_Remember: Good error handling is like a good safety net - you hope you never need it!_
