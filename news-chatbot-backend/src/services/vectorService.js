import { QdrantClient } from "@qdrant/qdrant-js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

class VectorService {
  constructor() {
    this.client = null;
    this.collectionName = process.env.COLLECTION_NAME || "news_articles";
    this.isConnected = false;
    this.maxRetries = 5;
    this.retryDelay = 2000;
    this.connectionTimeout = 15000;
  }

  async connect() {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔌 Connecting to Qdrant (attempt ${attempt}/${this.maxRetries})...`);
        console.log(`📡 URL: ${process.env.QDRANT_URL}`);
        console.log(`🔑 API Key configured: ${!!process.env.QDRANT_API_KEY}`);

        // Reset connection state
        this.isConnected = false;
        this.client = null;

        // Validate URL format
        if (!process.env.QDRANT_URL || !process.env.QDRANT_URL.startsWith("http")) {
          throw new Error("Invalid QDRANT_URL format. Must start with http:// or https://");
        }

        // Create new client instance
        this.client = new QdrantClient({
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
        });

        // Test connection with timeout
        console.log(`🧪 Testing Qdrant connection...`);
        const collections = await Promise.race([this.client.getCollections(), new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), this.connectionTimeout))]);

        console.log(`✅ Qdrant connection successful! Found ${collections.collections.length} collections`);
        this.isConnected = true;
        console.log("✅ Connected to Qdrant");

        return collections;
      } catch (error) {
        lastError = error;
        console.error(`❌ Connection attempt ${attempt} failed:`, error.message);

        // Reset client on failure
        this.isConnected = false;
        this.client = null;

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    console.error("💡 Check these common issues:");
    console.error("   - URL format: https://your-cluster.qdrant.tech:6333");
    console.error("   - API key is correct");
    console.error("   - Cluster is running in Qdrant Cloud");
    console.error("   - Network connectivity");

    throw new Error(`Failed to connect to Qdrant after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  // Ensure connection with auto-retry
  async ensureConnection() {
    if (!this.client || !this.isConnected) {
      console.log("🔄 Reconnecting to Qdrant...");
      await this.connect();
    }

    // Additional validation - test with a simple operation
    try {
      await this.client.getCollections();
    } catch (error) {
      console.warn("⚠️ Connection test failed, attempting reconnect...");
      this.isConnected = false;
      this.client = null;
      await this.connect();
    }
  }

  // Collection creation with better error handling
  async ensureCollection() {
    try {
      await this.ensureConnection();
      const collections = await this.client.getCollections();
      const exists = collections.collections.some((c) => c.name === this.collectionName);

      if (!exists) {
        console.log(`📦 Creating collection: ${this.collectionName}`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 768,
            distance: "Cosine",
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });
        console.log(`✅ Collection ${this.collectionName} created for Jina embeddings`);
      } else {
        console.log(`📦 Collection ${this.collectionName} already exists`);
      }
    } catch (error) {
      console.error("❌ Error ensuring collection:", error);
      throw error;
    }
  }

  // Enhanced metadata handling
  async storeEmbeddings(chunks, embeddings, metadata) {
    try {
      await this.ensureConnection();

      if (!this.client) {
        throw new Error("Qdrant client not connected");
      }

      console.log(`💾 Storing ${embeddings.length} embeddings in Qdrant...`);

      // Create points with enhanced metadata
      const points = embeddings
        .map((embedding, index) => {
          if (!Array.isArray(embedding) || embedding.length !== 768) {
            console.error(`❌ Invalid embedding at index ${index}: length ${embedding?.length}, expected 768. Skipping.`);
            return null;
          }

          if (embedding.some((val) => isNaN(val) || !isFinite(val))) {
            console.error(`❌ Embedding at index ${index} contains NaN or Infinity. Skipping point.`);
            return null;
          }

          return {
            id: uuidv4(),
            vector: embedding,
            payload: {
              text: String(chunks[index] || ""),
              title: metadata[index]?.title || "",
              source: metadata[index]?.source || "",
              link: metadata[index]?.link || "",
              pubDate: metadata[index]?.pubDate || "",
              category: metadata[index]?.category || "general",
              qualityScore: metadata[index]?.qualityScore || 0,
              wordCount: metadata[index]?.wordCount || 0,
              created_at: new Date().toISOString(),
              chunk_index: index,
            },
          };
        })
        .filter((point) => point !== null);

      const batchSize = embeddings.length > 200 ? 75 : 50;
      let totalStored = 0;

      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(points.length / batchSize);
        const progressPercent = ((totalStored / points.length) * 100).toFixed(1);

        console.log(`📤 Uploading batch ${batchNum}/${totalBatches} (${batch.length} points) - ${progressPercent}% stored`);

        try {
          await this.client.upsert(this.collectionName, {
            wait: true,
            points: batch,
          });
          totalStored += batch.length;
          console.log(`✅ Batch ${batchNum} uploaded successfully`);
        } catch (batchError) {
          console.error(`❌ Batch ${batchNum} failed:`, batchError.message);

          if (batchError.message.includes("timeout")) {
            console.log("⏳ Timeout error, waiting before next batch...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
          } else {
            throw new Error(`Batch upload failed: ${batchError.message}`);
          }
        }

        // Adaptive delay based on dataset size
        if (i + batchSize < points.length) {
          const delay = points.length > 500 ? 500 : 1000; // Shorter delays for large datasets
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      const finalInfo = await this.getCollectionInfo();
      console.log(`✅ Storage complete! Collection now has ${finalInfo.points_count || 0} points.`);
      return finalInfo.points_count;
    } catch (error) {
      console.error("❌ Error storing embeddings:", error.message);
      throw error;
    }
  }

  // Search with better error handling and validation
  async searchSimilar(queryEmbedding, topK = 5) {
    try {
      await this.ensureConnection();

      // Validate embedding
      if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
        throw new Error("Invalid query embedding: must be an array");
      }

      if (queryEmbedding.length !== 768) {
        throw new Error(`Invalid embedding dimension: ${queryEmbedding.length}, expected 768`);
      }

      if (queryEmbedding.some((val) => isNaN(val) || !isFinite(val))) {
        throw new Error("Invalid embedding: contains NaN or Infinity values");
      }

      console.log(`🔍 Searching with embedding of dimension ${queryEmbedding.length}`);

      const searchResult = await this.client.search(this.collectionName, {
        vector: queryEmbedding,
        limit: topK,
        with_payload: true,
        params: {
          hnsw_ef: 128,
        },
      });

      console.log(`🎯 Found ${searchResult.length} similar results`);

      return searchResult.map((result) => ({
        text: result.payload.text,
        score: result.score,
        metadata: result.payload,
      }));
    } catch (error) {
      console.error("❌ Error searching vectors:", error);
      console.error("❌ Query embedding info:", {
        isArray: Array.isArray(queryEmbedding),
        length: queryEmbedding?.length,
        sample: queryEmbedding?.slice(0, 3),
      });
      throw error;
    }
  }

  // Collection info with auto-reconnection
  async getCollectionInfo() {
    try {
      // Try to ensure connection, but don't fail if it's not available
      if (!this.client || !this.isConnected) {
        try {
          await this.ensureConnection();
        } catch (connectionError) {
          console.warn("⚠️ Could not establish connection for collection info");
          return { points_count: 0, status: "disconnected", error: connectionError.message };
        }
      }

      const info = await this.client.getCollection(this.collectionName);
      console.log(`📊 Collection '${this.collectionName}': ${info.points_count} points, status: ${info.status}`);
      return info;
    } catch (error) {
      if (error.message.includes("Not found")) {
        console.log(`📊 Collection '${this.collectionName}' not found`);
        return { points_count: 0, status: "not_found" };
      }
      console.error("❌ Error getting collection info:", error.message);
      return { points_count: 0, status: "error", error: error.message };
    }
  }

  // Clear collection with better error handling
  async clearCollection() {
    try {
      await this.ensureConnection();

      // Check if collection exists before trying to delete
      try {
        await this.client.getCollection(this.collectionName);
      } catch (error) {
        if (error.message.includes("Not found")) {
          console.log(`🗑️ Collection ${this.collectionName} doesn't exist, nothing to clear`);
          return true;
        }
        throw error;
      }

      await this.client.deleteCollection(this.collectionName);
      console.log(`🗑️ Collection ${this.collectionName} cleared`);
      return true;
    } catch (error) {
      console.error("❌ Error clearing collection:", error);
      return false;
    }
  }

  // Recreate collection
  async recreateCollection() {
    try {
      console.log(`🔄 Recreating collection for new embedding model...`);

      // Clear existing collection
      const clearSuccess = await this.clearCollection();
      if (!clearSuccess) {
        console.warn("⚠️ Failed to clear collection, but continuing...");
      }

      // Wait a moment for deletion to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Ensure new collection is created
      await this.ensureCollection();

      console.log("✅ Collection recreated successfully");
      return true;
    } catch (error) {
      console.error("❌ Error recreating collection:", error);
      throw error;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.client || !this.isConnected) {
        return {
          status: "disconnected",
          connected: false,
          collections: 0,
          error: "Client not connected",
        };
      }

      const collections = await this.client.getCollections();
      const collectionInfo = await this.getCollectionInfo();

      return {
        status: "connected",
        connected: true,
        collections: collections.collections.length,
        points_count: collectionInfo.points_count || 0,
        collection_status: collectionInfo.status,
      };
    } catch (error) {
      return {
        status: "error",
        connected: false,
        error: error.message,
      };
    }
  }

  // Connection state getter
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      hasClient: !!this.client,
      collectionName: this.collectionName,
    };
  }
}

const vectorService = new VectorService();
export default vectorService;
