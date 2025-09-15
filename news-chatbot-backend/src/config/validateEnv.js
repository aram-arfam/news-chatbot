const requiredVars = ["GEMINI_API_KEY", "JINA_API_KEY", "QDRANT_URL", "REDIS_HOST"];
requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
