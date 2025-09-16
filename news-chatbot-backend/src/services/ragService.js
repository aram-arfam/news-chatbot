import { GoogleGenerativeAI } from "@google/generative-ai";
import newsService from "./newsService.js";
import embeddingService from "./embeddingService.js";
import vectorService from "./vectorService.js";
import dotenv from "dotenv";

dotenv.config();

class RAGService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.isInitialized = false;
  }

  // Initialize RAG pipeline
  async initialize() {
    try {
      console.log("🚀 Initializing RAG pipeline...");

      // Connect to vector database
      await vectorService.connect();
      await vectorService.ensureCollection();

      // Check if we have embeddings already
      const collectionInfo = await vectorService.getCollectionInfo();

      if (collectionInfo && collectionInfo.points_count > 0) {
        console.log(`📊 Found ${collectionInfo.points_count} existing embeddings`);
        this.isInitialized = true;
        return;
      }

      // If no embeddings, create them
      console.log("📄 No embeddings found, creating new ones...");
      await this.buildKnowledgeBase();

      this.isInitialized = true;
      console.log("✅ RAG pipeline initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing RAG pipeline:", error);
      throw error;
    }
  }

  // Build knowledge base from news articles
  async buildKnowledgeBase() {
    try {
      console.log("🏗️ Building knowledge base...");

      // Get news articles
      const articles = await newsService.getArticles(true);
      if (articles.length === 0) {
        throw new Error("No articles found");
      }

      console.log(`📚 Processing ${articles.length} articles`);

      // Chunk articles and prepare metadata
      const allChunks = [];
      const allMetadata = [];
      for (const article of articles) {
        const chunks = newsService.chunkContent(article.content);
        for (const chunk of chunks) {
          allChunks.push(chunk);
          allMetadata.push({
            title: article.title,
            source: article.source,
            link: article.link,
            pubDate: article.pubDate,
            wordCount: chunk.split(" ").length,
          });
        }
      }

      console.log(`📝 Created ${allChunks.length} text chunks`);

      // Generate embeddings
      const embeddings = await embeddingService.batchGenerateEmbeddings(allChunks);

      // Store in vector database
      await vectorService.storeEmbeddings(allChunks, embeddings, allMetadata);

      // Set initialized flag after successful build
      this.isInitialized = true;

      console.log("✅ Knowledge base built successfully");
    } catch (error) {
      console.error("❌ Error building knowledge base:", error);
      this.isInitialized = false; // ✅ ADD THIS: Reset flag on failure
      throw error;
    }
  }

  // retrieveContext with automatic category detection
  async retrieveContext(query, topK = 5) {
    try {
      console.log(`🔍 Processing query: "${query}"`);

      // Generate query embedding
      const queryEmbedding = await embeddingService.generateQueryEmbedding(query);

      // Get more results than needed for filtering
      const candidates = await vectorService.searchSimilar(queryEmbedding, topK * 2);

      // Simple quality and relevance filtering
      const filtered = candidates
        .filter((result) => {
          // Basic quality threshold
          if (result.score < 0.7) return false;

          // Check if content is substantial
          const wordCount = result.text.split(" ").length;
          if (wordCount < 20) return false;

          // Simple query relevance check
          const queryWords = query
            .toLowerCase()
            .split(" ")
            .filter((word) => word.length > 2);
          const content = result.text.toLowerCase();
          const relevantMatches = queryWords.filter((word) => content.includes(word)).length;

          // At least 1 query word should match
          return relevantMatches >= 1;
        })
        .slice(0, topK);

      console.log(`📖 Retrieved ${filtered.length} relevant passages`);
      return filtered;
    } catch (error) {
      console.error("❌ Error retrieving context:", error);
      throw error;
    }
  }

  // Category detection method
  detectQueryCategory(query) {
    const lowerQuery = query.toLowerCase();

    // Use word boundaries for more accurate matching
    if (/\b(tech|technology|ai|artificial intelligence|software|app|digital|startup|innovation|computer|hardware)\b/.test(lowerQuery)) {
      return "technology";
    }
    if (/\b(business|market|stock|financial|economy|investment|revenue|corporate|company)\b/.test(lowerQuery)) {
      return "business";
    }
    if (/\b(world|global|international|politics|government|diplomatic|country|nation|election)\b/.test(lowerQuery)) {
      return "international";
    }

    return null; // No specific category detected
  }

  // Generate response using RAG
  async generateResponse(query, context) {
    try {
      const contextText = context.map((item, index) => `[${index + 1}] ${item.text}`).join("\n\n");

      const category = this.detectQueryCategory(query);
      const categoryHint = category ? `focusing on ${category} news` : "covering general news";

      const prompt = `You are a news assistant. Answer this question ${categoryHint}:
  
  "${query}"
  
  Here's relevant information from recent articles:
  ${contextText}
  
  Instructions:
  - Provide a clear, informative answer based on the context above
  - Focus on factual information and recent developments
  - If context is limited, mention that and suggest being more specific
  - Keep the response conversational but informative
  
  Your response:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return {
        answer: response,
        sources: context.map((item) => ({
          title: item.metadata.title,
          source: item.metadata.source,
          score: item.score,
        })),
      };
    } catch (error) {
      console.error("❌ Error generating response:", error);
      throw error;
    }
  }

  // Main RAG query method
  async query(userQuery) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Processing query: ${userQuery}`);

      // Validate query before processing
      if (!userQuery || userQuery.trim().length === 0) {
        throw new Error("Empty query provided");
      }

      // NEW: Handle greetings and casual messages FIRST
      const greetingResponse = this.handleGreetings(userQuery.trim());
      if (greetingResponse) {
        return {
          query: userQuery,
          answer: greetingResponse,
          sources: [],
          contextCount: 0,
          timestamp: new Date().toISOString(),
          fallback: true,
        };
      }

      // Retrieve relevant context for actual news queries
      const context = await this.retrieveContext(userQuery.trim());

      // Generate response
      const result = await this.generateResponse(userQuery, context);

      return {
        query: userQuery,
        answer: result.answer,
        sources: result.sources,
        contextCount: context.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error processing RAG query:", error);
      throw error;
    }
  }

  // New greeting detection method
  handleGreetings(query) {
    const lowerQuery = query.toLowerCase().trim();

    // Define greeting patterns
    const greetings = ["hi", "hello", "hey", "hii", "hiii", "sup", "yo"];
    const casual = ["good morning", "good afternoon", "good evening", "howdy"];
    const questions = ["how are you", "how r u", "whats up", "what's up", "how do you do"];

    // Exact matches for simple greetings
    if (greetings.includes(lowerQuery)) {
      return "Hello! I'm your news assistant. I can help you with the latest news and current events. Try asking me something like 'What's the latest technology news?' or 'Tell me about recent business updates.'";
    }

    // Partial matches for casual greetings
    if (casual.some((greeting) => lowerQuery.includes(greeting))) {
      return "Good day! I'm here to help you stay updated with the latest news. What topic interests you - technology, business, international affairs, or something else?";
    }

    // Question-based greetings
    if (questions.some((question) => lowerQuery.includes(question))) {
      return "I'm doing great, thanks for asking! I'm ready to help you explore the latest news. What would you like to know about?";
    }

    // Very short queries (1-2 characters) that might be typos
    if (lowerQuery.length <= 2 && /^[a-zA-Z]+$/.test(lowerQuery)) {
      return "Hi there! I'm your news assistant. Please ask me about specific news topics like technology, business, or world events.";
    }

    return null; // Not a greeting, proceed with normal RAG processing
  }

  // Get pipeline status
  async getStatus() {
    try {
      let collectionInfo = null;
      let vectorDbStatus = "disconnected";

      try {
        if (vectorService.isConnected) {
          collectionInfo = await vectorService.getCollectionInfo();
          vectorDbStatus = "connected";
        }
      } catch (error) {
        console.warn("⚠️ Could not get collection info:", error.message);
        vectorDbStatus = "error";
      }

      return {
        initialized: this.isInitialized,
        vectorDatabase: {
          connected: vectorService.isConnected,
          collection: vectorService.collectionName,
          pointsCount: collectionInfo?.points_count || 0,
          status: vectorDbStatus,
        },
        services: {
          gemini: !!process.env.GEMINI_API_KEY,
          jina: !!process.env.JINA_API_KEY,
          qdrant: !!process.env.QDRANT_URL,
        },
      };
    } catch (error) {
      console.error("❌ Error getting RAG status:", error.message);
      return {
        initialized: false,
        error: error.message,
        services: {
          gemini: !!process.env.GEMINI_API_KEY,
          jina: !!process.env.JINA_API_KEY,
          qdrant: !!process.env.QDRANT_URL,
        },
      };
    }
  }
}

const ragService = new RAGService();
export default ragService;
