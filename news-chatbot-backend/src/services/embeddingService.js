import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

class EmbeddingService {
  constructor(modelName = "jina-embeddings-v2-base-en") {
    this.jinaApiKey = process.env.JINA_API_KEY;
    this.apiUrl = "https://api.jina.ai/v1/embeddings";
    this.model = modelName;
    this.expectedDimension = 768;
    this.maxRetries = 3;
    this.baseRetryDelay = 2000;
  }

  async generateEmbeddings(texts, retryCount = 0) {
    if (!this.jinaApiKey) {
      throw new Error("JINA_API_KEY not configured");
    }

    const cleanTexts = texts
      .map((text) =>
        String(text || "")
          .trim()
          .substring(0, 4000)
      )
      .filter((text) => text.length > 2);

    if (cleanTexts.length === 0) {
      console.warn("⚠️ No valid texts after cleaning");
      return [];
    }

    const processedTexts = cleanTexts.map((text) => {
      if (text.length < 10) {
        // Expand short queries for better embeddings
        return `User message: ${text}. This is a short conversational message.`;
      }
      return text;
    });

    try {
      console.log(`🧮 Generating embeddings for ${processedTexts.length} texts using ${this.model} (attempt ${retryCount + 1})`);

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          input: processedTexts, // Use processed texts
        },
        {
          headers: {
            Authorization: `Bearer ${this.jinaApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 75000,
        }
      );

      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        console.error("❌ Invalid API response structure:", response.data);
        throw new Error("Invalid response format from Jina API");
      }

      const embeddings = response.data.data.map((item) => item.embedding);

      // Validate each embedding individually
      for (let i = 0; i < embeddings.length; i++) {
        const embedding = embeddings[i];
        if (!Array.isArray(embedding)) {
          throw new Error(`Embedding ${i} is not an array: ${typeof embedding}`);
        }
        if (embedding.length !== this.expectedDimension) {
          console.error(`❌ Embedding ${i} dimension mismatch:`, {
            received: embedding.length,
            expected: this.expectedDimension,
            sample: embedding.slice(0, 5),
          });
          throw new Error(`Invalid embedding dimension at index ${i}: ${embedding.length}, expected ${this.expectedDimension}`);
        }
      }

      console.log(`✅ Generated ${embeddings.length} valid ${this.expectedDimension}D embeddings`);
      return embeddings;
    } catch (error) {
      console.error(`❌ Jina API error (attempt ${retryCount + 1}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Exponential backoff retry
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = this.baseRetryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 Retrying in ${delay}ms... (${error.response?.status || error.code})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateEmbeddings(texts, retryCount + 1);
      }

      throw new Error(`Jina embedding failed after ${retryCount + 1} attempts: ${error.message}`);
    }
  }

  // error classification
  isRetryableError(error) {
    const retryableStatuses = [429, 500, 502, 503, 504];
    const retryableCodes = ["ECONNRESET", "ETIMEDOUT", "ECONNABORTED"];
    const status = error.response?.status;
    const code = error.code;
    const message = error.message?.toLowerCase() || "";

    // Don't retry validation errors
    if (message.includes("dimension") || message.includes("invalid embedding")) {
      return false;
    }

    return retryableStatuses.includes(status) || retryableCodes.includes(code) || message.includes("timeout");
  }

  async generateQueryEmbedding(query) {
    const embeddings = await this.generateEmbeddings([query]);
    return embeddings[0];
  }

  async batchGenerateEmbeddings(texts, batchSize = 12) {
    console.log(`🔄 Processing ${texts.length} texts in batches of ${batchSize} (optimized for enhanced news ingestion)`);
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(texts.length / batchSize);

      const progressPercent = ((i / texts.length) * 100).toFixed(1);
      console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} texts) - ${progressPercent}% complete`);

      try {
        const batchEmbeddings = await this.generateEmbeddings(batch);
        allEmbeddings.push(...batchEmbeddings);

        if (i + batchSize < texts.length) {
          const delay = texts.length > 100 ? 2000 : 2500;
          console.log(`⏱️ Waiting ${delay}ms before next batch...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`❌ Batch ${batchNum} failed completely:`, error.message);
        throw error;
      }
    }

    console.log(`✅ Batch processing complete: ${allEmbeddings.length} embeddings generated`);
    return allEmbeddings;
  }
}

const embeddingService = new EmbeddingService();
export default embeddingService;
