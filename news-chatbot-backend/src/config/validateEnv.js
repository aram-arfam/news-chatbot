const requiredVars = ["GEMINI_API_KEY", "JINA_API_KEY", "QDRANT_URL", "REDIS_HOST", "NODE_ENV"];
requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Redis-specific validation
if (process.env.REDIS_HOST && !process.env.REDIS_PASSWORD) {
  console.warn("⚠️ REDIS_HOST provided but REDIS_PASSWORD missing");
}
