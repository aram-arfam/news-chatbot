# ⚙️ /src/config - The Application's Command Center

Welcome to the **configuration command center**\! Think of this folder as the backstage of a concert—it's where we tune the instruments, check the sound system, and ensure everything is perfectly set up before the main performance begins. Proper configuration is the invisible foundation of a stable and reliable application.

## 📁 What Lives Here

config/
├── 📡 redis.js # Manages the Redis connection and client
└── ✅ validateEnv.js # Validates all required environment variables

---

## 🎯 The Configuration Team

### 📡 `redis.js` - The Memory Manager

_"Your application's fast, short-term memory specialist"_

Redis acts as your application's **lightning-fast notepad**—perfect for caching frequently requested data, managing real-time chat sessions, and ensuring a snappy user experience. This module centralizes all connection logic.

**What it does:**

- 🔌 **Establishes a resilient connection** to your Redis instance (local or cloud).
- 🔄 **Handles connection retries** automatically using an exponential backoff strategy.
- 🛡️ **Manages TLS encryption** by default for secure connections to cloud providers.
- 📊 **Provides connection status** that can be integrated into a health check endpoint.

**Key Features Explained:**

This configuration is designed to be robust and environment-aware.

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

**When to modify:**

- Adjusting connection timeout settings or retry logic.
- Implementing Redis Pub/Sub capabilities.
- Adding custom event listeners for monitoring (e.g., `on('reconnecting', ...)`).

### ✅ `validateEnv.js` - The Pre-Flight Inspector

_"The methodical inspector who ensures nothing important is forgotten before takeoff"_

Before the application starts, this module acts like an **airport safety inspector**—it meticulously checks that all essential environment variables are present. If anything is missing, the application will stop immediately with a clear error message.

**What it validates:**

- 🤖 `GEMINI_API_KEY`: For the core AI conversation engine.
- 🧮 `JINA_API_KEY`: For the text embedding service.
- 📊 `QDRANT_URL` & `QDRANT_API_KEY`: For the vector database connection.
- 🚀 `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: For the cache and session store.

**How it works:**

The script iterates through a list of required variables and throws an error if any are missing, preventing the app from starting in a misconfigured state.

```javascript
function validateEnvironment() {
  const requiredVars = [
    "GEMINI_API_KEY", // 🤖 AI brain
    "JINA_API_KEY", // 🧮 Text understanding
    "QDRANT_URL", // 📊 Knowledge storage
    "REDIS_HOST", // 🚀 Fast memory
    // ... add any new required variables here
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missingVars.join(", ")}`);
  }
  console.log("✅ Environment variables are valid.");
}

// This function is called once at server startup.
validateEnvironment();
```

**Why this is crucial:**

- **Prevents Mysterious Runtime Errors** 🐛: Avoids bugs caused by an undefined API key deep within the application logic.
- **Fails Fast & Loud** ⚡: Provides immediate, clear feedback about what is wrong with the configuration.
- **Saves Debugging Time** ⏰: Instantly points developers to the exact problem during setup or deployment.

---

## 🚀 Startup Sequence & Design Philosophy

The application follows a strict startup procedure to ensure stability.

### 1\. Startup Sequence

1.  **Load Environment**: The `.env` file is loaded into `process.env`.
2.  **Validate Environment**: `validateEnv.js` runs immediately, checking for all required variables. The process will exit if any are missing.
3.  **Initialize Connections**: The `redis.js` module establishes its connection.
4.  **Configure Services**: Other core services (like the RAG pipeline) are initialized.
5.  **Start Server**: The Express server begins listening for requests.
6.  **Application Ready\!** ✨

### 2\. Core Principles

- **Resilient Connections**: The Redis client is configured with an **exponential backoff** retry strategy. This means it won't overwhelm a temporarily unavailable service and will gracefully attempt to reconnect.
- **Fail-Fast on Startup**: The environment validation ensures the application never starts in a broken state, making deployments more predictable and reliable.

---

## 🛠️ Customization & Best Practices

### Adding a New Environment Variable

1.  **Add to `.env.example`**: Document the new variable with a comment explaining its purpose.
2.  **Add to `validateEnv.js`**: Add the variable name to the `requiredVars` array.
3.  **Update `.env`**: Add the new variable and its value to your local environment file.
4.  **Test**: Run the application without the new variable to ensure the validation fails as expected.

### `.env.example` Structure

```env
# 🤖 AI Services
GEMINI_API_KEY=your_gemini_key_here
JINA_API_KEY=your_jina_key_here

# 📊 Databases
QDRANT_URL=https://your-cluster.qdrant.tech:6333
QDRANT_API_KEY=your_qdrant_key

# 🚀 Redis Configuration
REDIS_HOST=your-redis-cloud-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
```

---

## 🐛 Troubleshooting

### Redis Connection Fails

- **Check Host Format**: Ensure `REDIS_HOST` does not include the `redis://` prefix.
- **Verify Credentials**: Double-check your `REDIS_PASSWORD` and `REDIS_PORT`.
- **Firewall Rules**: Confirm that your server's IP address is whitelisted in your Redis Cloud instance settings.
- **Check Service Status**: Make sure your Redis Cloud instance is active and running.

### Environment Validation Error on Startup

```sh
Error: ❌ Missing required environment variables: GEMINI_API_KEY
```

- **Check File Name**: Ensure your environment file is named exactly `.env`.
- **Check Variable Names**: Variable names are case-sensitive. `GEMINI_API_KEY` is not the same as `gemini_api_key`.
- **Restart Server**: Changes to `.env` require a server restart to take effect.

---

Remember: **Good configuration is like a solid foundation—you might not see it, but the stability of the entire structure depends on it being right\!**
