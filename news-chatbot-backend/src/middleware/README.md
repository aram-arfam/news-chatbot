# 🛡️ /src/middleware - The Guardian Layer

Welcome to the **middleware fortress**! Think of middleware as the **security checkpoint, traffic controller, and customer service desk** all rolled into one. Every request that comes into your application must pass through these guardians first.

---

## 📁 What Lives Here

```
middleware/
└── 🚨 errorHandler.js    # Comprehensive error management system
```

***

## 🛡️ The Guardian: `errorHandler.js`

*"The Swiss Army knife of error management - handles everything from traffic jams to system crashes"*

This isn't just an error handler; it's a complete **request protection and monitoring system** that ensures your application runs smoothly and fails gracefully when things go wrong.

***

## 🎯 Core Responsibilities

### 1. 🚨 Error Handling & Logging
*"The incident reporter who documents everything"*

Captures and logs detailed error information for comprehensive debugging:

```javascript
// Captures and logs detailed error information
await this.logError(error, req, {
  requestId: req.id,
  userAgent: req.get('user-agent'),
  timestamp: new Date().toISOString()
});
```

#### What It Logs
- 📝 Error messages and stack traces
- 🌐 Request details (method, URL, headers, body)
- 👤 User information (IP, user agent)
- ⏰ Precise timestamps
- 🔍 Additional context data

***

### 2. 🚦 Rate Limiting Protection
*"The bouncer who prevents overcrowding"*

Prevents API abuse and ensures fair usage across all endpoints:

```javascript
// Prevents API abuse and ensures fair usage
rateLimitHandler(req, res, next, { windowMs: 60000, max: 10 })
```

#### Protection Features
- ⏱️ **Time-based windows** (e.g., 10 requests per minute)
- 🔒 **Per-IP tracking** to prevent individual abuse
- ⚡ **Fast response** for exceeded limits
- 📊 **Usage analytics** for monitoring patterns

***

### 3. 🎭 Graceful Error Classification
*"The translator who speaks human language"*

Converts technical errors into user-friendly messages:

```javascript
// Before: "ValidationError: Path email is required"
// After: "Email address is required"

// Before: "JsonWebTokenError: invalid signature"  
// After: "Your session has expired, please log in again"
```

#### Error Types Handled

| Error Type | Technical Message | User-Friendly Message |
|------------|-------------------|----------------------|
| 🔐 Authentication | `JsonWebTokenError` | "Your session has expired, please log in again" |
| ✅ Validation | `ValidationError: Path email is required` | "Email address is required" |
| 🔄 Service | `ECONNREFUSED` | "Service temporarily unavailable - please try again" |
| 💥 System | `Internal Server Error` | "Something went wrong on our end" |

***

### 4. 🏥 Health Monitoring
*"The doctor who checks the vital signs"*

Real-time system health reporting and diagnostics:

```javascript
// Real-time system health reporting
const health = {
  status: "healthy",
  services: {
    redis: redisManager.isConnected,
    qdrant: vectorService.isConnected,
    ai: ragService.isInitialized
  },
  errors: { 
    recent: await this.getRecentErrors(), 
    count24h: await this.getErrorCount(24) 
  }
};
```

***

## 🔧 Key Features Breakdown

### Async Error Wrapper
*"The safety net for asynchronous operations"*

Wraps async route handlers to catch Promise rejections automatically:

```javascript
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
```

### Service-Specific Error Handling
*"The specialist who knows each service's quirks"*

Provides tailored error messages for different services:

```javascript
// RAG service errors
if (err.message.includes("Jina") || err.message.includes("embedding")) {
  return "AI service temporarily unavailable - please try again in a moment";
}

// Vector database errors
if (err.message.includes("Qdrant") || err.message.includes("vector")) {
  return "Search service temporarily unavailable - please try again in a moment";
}
```

### Development vs Production Modes
*"The information gatekeeper"*

Adapts error responses based on environment:

```javascript
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
```

***

## 🛠️ Usage Examples

### In Route Handlers

#### Automatic Error Handling
```javascript
// Automatic error handling
app.post('/api/chat', errorHandler.asyncHandler(async (req, res) => {
  const result = await chatService.processMessage(req.body.message);
  res.json(result);
}));
```

#### Manual Error Creation
```javascript
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
```

### Rate Limiting Setup

#### Chat Endpoint Protection
```javascript
// Chat endpoint: 10 messages per minute
app.use('/api/chat', (req, res, next) => {
  errorHandler.rateLimitHandler(req, res, next, {
    windowMs: 60000, // 1 minute
    max: 10         // 10 requests
  });
});
```

#### Health Check Configuration
```javascript
// Health check: 60 requests per minute (more lenient)
app.use('/api/health', (req, res, next) => {
  errorHandler.rateLimitHandler(req, res, next, {
    windowMs: 60000,
    max: 60
  });
});
```

***

## 📊 Error Monitoring & Analytics

### Log File Structure
```
logs/
├── error-2024-01-15.log    # Daily error logs
├── error-2024-01-16.log
└── error-2024-01-17.log
```

### Sample Log Entry
```json
{
  "timestamp": "2024-01-15T14:30:22.123Z",
  "error": {
    "message": "AI service timeout",
    "stack": "...",
    "name": "TimeoutError"
  },
  "request": {
    "method": "POST",
    "url": "/api/chat",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "additionalContext": {
    "sessionId": "abc123",
    "messageLength": 45
  }
}
```

***

## 🚀 Best Practices

### 1. Always Use AsyncHandler

**✅ Good:** Errors are automatically caught
```javascript
app.get('/api/data', errorHandler.asyncHandler(async (req, res) => {
  const data = await database.getData();
  res.json(data);
}));
```

**❌ Bad:** Unhandled promise rejections
```javascript
app.get('/api/data', async (req, res) => {
  const data = await database.getData(); // If this fails, app crashes!
  res.json(data);
});
```

### 2. Create Meaningful Errors

**✅ Good:** Specific, actionable error
```javascript
throw errorHandler.createError(
  "Email address is already registered",
  409,
  "DUPLICATE_EMAIL"
);
```

**❌ Bad:** Generic, unhelpful error
```javascript
throw new Error("Something went wrong");
```

### 3. Log with Context

**✅ Good:** Rich context for debugging
```javascript
await errorHandler.logError(error, req, {
  userId: req.user?.id,
  operation: 'news_search',
  queryComplexity: 'high'
});
```

**❌ Bad:** Just the error message
```javascript
console.error(error.message);
```

***

## 🐛 Troubleshooting

### High Error Rates

Check the health endpoint for service status:
```bash
curl http://localhost:3001/api/health
```

**Common causes:**
- External service downtime
- Database connection issues
- Rate limiting threshold too low
- Memory/CPU resource constraints

### Rate Limiting Issues

Monitor rate limit violations in logs:
```bash
grep "rate limit" logs/error-$(date +%Y-%m-%d).log
```

**Solutions:**
- Adjust rate limit thresholds
- Implement user-specific limits
- Add request queuing for high-priority users
- Cache frequently requested data

### Service Degradation

Implement graceful fallback responses:
```javascript
// Service unavailable but app still works
if (aiServiceDown) {
  return "I'm having trouble with my AI brain right now. Please try again in a few minutes!";
}
```

***

## 🔍 Monitoring Dashboard

### Error Rate Tracking
- **📈 Real-time error counts** by endpoint and error type
- **⏰ Historical trends** to identify patterns
- **🚨 Alert thresholds** for automated notifications

### Performance Metrics
- **⚡ Response times** before and after errors
- **📊 Success/failure ratios** by service
- **🔄 Recovery times** after service interruptions

### Health Check Endpoints

```javascript
// Detailed system health
GET /api/health/detailed
{
  "status": "healthy",
  "uptime": "2d 4h 15m",
  "services": {
    "redis": { "status": "connected", "latency": "2ms" },
    "qdrant": { "status": "connected", "collections": 1 },
    "ai": { "status": "ready", "model": "gemini-pro" }
  },
  "errors": {
    "last24h": 3,
    "severity": { "low": 2, "medium": 1, "high": 0 }
  }
}
```

***

**Remember: Good error handling is like a good safety net - you hope you never need it, but you're grateful when it's there!** 🛡️
