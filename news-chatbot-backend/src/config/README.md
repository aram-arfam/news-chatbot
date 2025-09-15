# ⚙️ /src/config - The Application's Command Center

Welcome to the **configuration command center**! Think of this folder as the backstage of a concert—it's where we tune the instruments, check the sound system, and ensure everything is perfectly set up before the main performance begins.

Proper configuration is the invisible foundation of a stable and reliable application.

***

## 📁 What Lives Here

```
config/
├── 📡 redis.js          # Manages the Redis connection and client
└── ✅ validateEnv.js    # Validates all required environment variables
```

***

## 🎯 The Configuration Team

### 📡 `redis.js` - The Memory Manager
*"Your application's fast, short-term memory specialist"*

Redis acts as your application's **lightning-fast notepad**—perfect for caching frequently requested data, managing real-time chat sessions, and ensuring a snappy user experience. This module centralizes all connection logic.

#### What It Does
- 🔌 **Establishes a resilient connection** to your Redis instance (local or cloud)
- 🔄 **Handles connection retries** automatically using an exponential backoff strategy
- 🛡️ **Manages TLS encryption** by default for secure connections to cloud providers
- 📊 **Provides connection status** that can be integrated into a health check endpoint

#### Smart Configuration Features

This configuration is designed to be robust and environment-aware:

```javascript
// A smart configuration that adapts to the environment
const isRedisCloud = process.env.REDIS_HOST.includes("redis-cloud.com");
const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  // Automatically enable TLS for secure cloud connections
  tls: isRedisCloud ? {} : undefined,
  // Smart retry strategy: wait a little longer after each failed attempt
  // (50ms, 100ms, 150ms...), capping at 2 seconds to avoid long waits.
  retryStrategy: (times) => Math.min(times * 50, 2000),
};
```

#### When to Modify
- Adjusting connection timeout settings or retry logic
- Implementing Redis Pub/Sub capabilities
- Adding custom event listeners for monitoring (e.g., `on('reconnecting', ...)`)

***

### ✅ `validateEnv.js` - The Pre-Flight Inspector
*"The methodical inspector who ensures nothing important is forgotten before takeoff"*

Before the application starts, this module acts like an **airport safety inspector**—it meticulously checks that all essential environment variables are present. If anything is missing, the application will stop immediately with a clear error message.

#### What It Validates

| Variable | Purpose | Service |
|----------|---------|---------|
| `GEMINI_API_KEY` | Core AI conversation engine | 🤖 Google AI |
| `JINA_API_KEY` | Text embedding service | 🧮 Jina AI |
| `QDRANT_URL` | Vector database connection | 📊 Qdrant |
| `QDRANT_API_KEY` | Vector database authentication | 📊 Qdrant |
| `REDIS_HOST` | Cache and session store | 🚀 Redis |
| `REDIS_PORT` | Redis connection port | 🚀 Redis |
| `REDIS_PASSWORD` | Redis authentication | 🚀 Redis |

#### How It Works

The script iterates through required variables and throws an error if any are missing:

```javascript
function validateEnvironment() {
  const requiredVars = [
    "GEMINI_API_KEY",    // 🤖 AI brain
    "JINA_API_KEY",      // 🧮 Text understanding
    "QDRANT_URL",        // 📊 Knowledge storage
    "REDIS_HOST",        // 🚀 Fast memory
    // ... add any new required variables here
  ];
  
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missingVars.join(", ")}`);
  }
  
  console.log("✅ Environment variables are valid.");
}

// This function is called once at server startup
validateEnvironment();
```

#### Why This Is Crucial
- **🐛 Prevents Mysterious Runtime Errors:** Avoids bugs caused by undefined API keys deep within application logic
- **⚡ Fails Fast & Loud:** Provides immediate, clear feedback about configuration problems
- **⏰ Saves Debugging Time:** Instantly points developers to the exact problem during setup or deployment

***

## 🚀 Startup Sequence & Design Philosophy

The application follows a strict startup procedure to ensure stability.

### 1. Startup Sequence

```
1. Load Environment     → .env file loaded into process.env
2. Validate Environment → validateEnv.js checks required variables
3. Initialize Redis     → redis.js establishes connection
4. Configure Services   → RAG pipeline and other services initialize
5. Start Express Server → Server begins listening for requests
6. Application Ready! ✨ → Ready to handle user requests
```

### 2. Core Principles

- **🔄 Resilient Connections:** Redis client uses **exponential backoff** retry strategy to avoid overwhelming temporarily unavailable services
- **⚡ Fail-Fast on Startup:** Environment validation ensures the application never starts in a broken state, making deployments predictable and reliable

***

## 🛠️ Customization & Best Practices

### Adding a New Environment Variable

Follow these steps to safely add new configuration:

1. **📝 Add to `.env.example`:** Document the new variable with a descriptive comment
2. **✅ Add to `validateEnv.js`:** Include the variable name in the `requiredVars` array
3. **🔧 Update `.env`:** Add the new variable and its value to your local environment file
4. **🧪 Test:** Run the application without the new variable to ensure validation fails as expected

### `.env.example` Structure

```env
# 🤖 AI Services
GEMINI_API_KEY=your_gemini_key_here
JINA_API_KEY=your_jina_key_here

# 📊 Vector Database
QDRANT_URL=https://your-cluster.qdrant.tech:6333
QDRANT_API_KEY=your_qdrant_key

# 🚀 Redis Configuration
REDIS_HOST=your-redis-cloud-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password

# 🔧 Application Settings
PORT=3001
NODE_ENV=development
```

***

## 🐛 Troubleshooting

### Redis Connection Issues

**❌ Connection fails**

Check these common issues:

- **Host Format:** Ensure `REDIS_HOST` does not include the `redis://` prefix
- **Verify Credentials:** Double-check `REDIS_PASSWORD` and `REDIS_PORT`
- **Firewall Rules:** Confirm your server's IP is whitelisted in Redis Cloud settings
- **Service Status:** Verify your Redis Cloud instance is active and running

**Debug commands:**
```bash
# Test Redis connection
redis-cli -h your-redis-host -p 6379 -a your-password ping

# Check Redis config in Node.js
console.log('Redis Config:', redisConfig);
```

### Environment Validation Errors

**❌ Missing variables error:**
```
Error: ❌ Missing required environment variables: GEMINI_API_KEY
```

**Common solutions:**

- **📁 Check File Name:** Ensure your environment file is named exactly `.env`
- **🔤 Check Variable Names:** Variable names are case-sensitive (`GEMINI_API_KEY` ≠ `gemini_api_key`)
- **🔄 Restart Server:** Changes to `.env` require a server restart to take effect
- **📍 File Location:** Verify `.env` is in the project root directory

### Connection Health Monitoring

Add health check endpoints to monitor configuration status:

```javascript
// Health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    services: {
      redis: redisClient.status === 'ready' ? 'connected' : 'disconnected',
      environment: 'validated'
    }
  };
  res.json(health);
});
```

***

## 📚 Configuration Security Best Practices

### Environment Variable Security
- **🔐 Never commit `.env` files** to version control
- **🔑 Use strong, unique passwords** for all services
- **🔄 Rotate API keys regularly** in production
- **🚫 Avoid hardcoding secrets** in configuration files

### Production Considerations
- **🌐 Use environment-specific configs** for different deployment stages
- **📊 Monitor connection health** with logging and alerting
- **🔒 Enable TLS/SSL** for all external service connections
- **📈 Set appropriate timeouts** and retry limits

***

**Remember: Good configuration is like a solid foundation—you might not see it, but the stability of the entire structure depends on it being right!** 🏗️
