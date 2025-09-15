import axios from "axios";
import * as cheerio from "cheerio";
import { parse } from "node-html-parser";
import xml2js from "xml2js";
import { stripHtml } from "string-strip-html";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

class NewsService {
  constructor() {
    this.articles = [];
    this.baseDir = "./data";
  }

  // RSS feeds to scrape
  getRSSFeeds() {
    return {
      // 🌍 MAJOR INTERNATIONAL NEWS (High Authority)
      international: [
        "https://feeds.bbci.co.uk/news/rss.xml", // BBC News - Global
        "https://www.aljazeera.com/xml/rss/all.xml", // Al Jazeera English
        "https://feeds.npr.org/1001/rss.xml", // NPR News
        "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", // NY Times
        "https://feeds.washingtonpost.com/rss/world", // Washington Post
        "https://www.theguardian.com/world/rss", // The Guardian
        "https://rss.dw.com/rdf/rss-en-all", // Deutsche Welle
      ],

      // 💼 BUSINESS & FINANCE NEWS
      business: [
        "https://feeds.wsj.com/wsj/business", // Wall Street Journal
        "https://feeds.reuters.com/reuters/businessNews", // Reuters Business
        "https://feeds.cnbc.com/cnbc/business", // CNBC Business
        "https://feeds.fortune.com/fortune/feeds/all", // Fortune
      ],

      // 🔬 TECHNOLOGY & SCIENCE
      technology: [
        "https://feeds.arstechnica.com/arstechnica/index", // Ars Technica - Working ✅
        "https://feeds.techcrunch.com/TechCrunch/", // TechCrunch ✅
        "https://www.wired.com/feed/rss", // Wired - Working ✅
        "https://rss.cnet.com/rss/all", // CNET ✅
        "https://feeds.engadget.com/engladget/latest", // Engadget ✅
        "https://www.theverge.com/rss/index.xml", // The Verge ✅
        "https://feeds.feedburner.com/venturebeat/SZYF", // VentureBeat ✅
        "https://feeds.feedburner.com/TheHackersNews", // Security focus ✅
      ],

      // 🏥 HEALTH & SCIENCE
      health: [
        "https://feeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC", // WebMD
        "https://feeds.reuters.com/reuters/health", // Reuters Health
        "https://www.cdc.gov/feeds/homepage/rss.xml", // CDC News
        "https://feeds.nature.com/nature/rss/current", // Nature Journal
      ],

      // 🌏 REGIONAL DIVERSITY
      regional: [
        // Asia-Pacific
        "https://www.japantimes.co.jp/feed/topstories/", // Japan Times
        "https://feeds.hindustantimes.com/HT/TopNews", // Hindustan Times
        "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", // Times of India
        "https://www.scmp.com/rss/4/feed", // South China Morning Post

        // Europe
        "https://feeds.euronews.com/en/news", // Euronews
        "https://feeds.france24.com/en/latest", // France 24
        "https://feeds.elpais.com/mrss-s/pages/ep/site/english.com/portada", // El País English

        // Middle East & Africa
        "https://www.middleeasteye.net/rss.xml", // Middle East Eye
        "https://feeds.haaretz.com/haaretz/cmlink/1.628016", // Haaretz English

        // Americas
        "https://www.cbc.ca/cmlink/rss-topstories", // CBC Canada
        "https://feeds.globalnews.ca/GlobalNews/TopStories", // Global News Canada
      ],

      // 🎯 SPECIALIZED SOURCES
      specialized: [
        "https://feeds.feedburner.com/usnews/news", // US News & World Report
        "https://feeds.politico.com/politico/politics", // Politico
        "https://feeds.time.com/time/topstories", // TIME Magazine
        "https://feeds.nbcnews.com/nbcnews/public/news", // NBC News
        "https://feeds.cbsnews.com/CBSNews/latest", // CBS News
        "https://feeds.usatoday.com/usatoday-NewsTopStories", // USA Today
      ],
    };
  }

  classifyArticleContent(title, description, content = "", sourceDomain = "") {
    const text = `${title} ${description} ${content}`.toLowerCase();

    // Simple keyword matching with priority order
    const categories = [
      {
        name: "technology",
        keywords: ["ai", "tech", "software", "app", "digital", "cyber", "startup", "innovation", "computer", "hardware"],
      },
      {
        name: "business",
        keywords: ["business", "market", "stock", "revenue", "investment", "financial", "economy", "corporate"],
      },
      {
        name: "international",
        keywords: ["world", "global", "diplomatic", "government", "political", "election", "country", "nation"],
      },
    ];

    // Find category with most keyword matches
    let bestMatch = { name: "general", score: 0 };

    for (const category of categories) {
      const score = category.keywords.filter((keyword) => text.includes(keyword)).length;
      if (score > bestMatch.score && score >= 1) {
        bestMatch = { name: category.name, score };
      }
    }

    // Fallback to source-based classification for trusted sources
    if (bestMatch.name === "general") {
      const sourceMappings = {
        "techcrunch.com": "technology",
        "arstechnica.com": "technology",
        "wired.com": "technology",
        "theverge.com": "technology",
        "wsj.com": "business",
        "cnbc.com": "business",
        "fortune.com": "business",
        "bbc.co.uk": "international",
        "reuters.com": "international",
        "apnews.com": "international",
      };

      for (const [domain, category] of Object.entries(sourceMappings)) {
        if (sourceDomain.includes(domain)) {
          return category;
        }
      }
    }

    return bestMatch.name;
  }

  // Extract text from RSS item (handles arrays/objects)
  extractText(item) {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (Array.isArray(item) && item.length > 0) return item[0];
    if (item._ || item.$?.href) return item._ || item.$?.href;
    return String(item);
  }

  // Scrape full article content
  async scrapeArticleContent(articleUrl) {
    try {
      const response = await axios.get(articleUrl, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $("script, style, nav, header, footer, .advertisement, .ads").remove();

      // Try multiple selectors for article content
      const contentSelectors = ["article p", ".article-body p", ".story-body p", ".entry-content p", ".post-content p", "main p", ".content p", "p"];

      let content = "";
      for (const selector of contentSelectors) {
        const paragraphs = $(selector);
        if (paragraphs.length > 3) {
          // Ensure we have substantial content
          content = paragraphs
            .map((i, el) => $(el).text().trim())
            .get()
            .join(" ");
          break;
        }
      }

      // Clean and validate content
      content = stripHtml(content).result;
      content = content.replace(/\s+/g, " ").trim();

      if (content.length < 200) {
        throw new Error("Content too short");
      }

      return content;
    } catch (error) {
      console.error(`❌ Error scraping ${articleUrl}:`, error.message);
      return null;
    }
  }

  // ✅ UPDATED: Enhanced RSS parsing with smart categorization
  async parseRSSFeed(feedUrl, feedCategory = "general") {
    try {
      console.log(`📡 Fetching RSS feed: ${feedUrl} (${feedCategory})`);
      const response = await axios.get(feedUrl, {
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
      });

      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        trim: true,
      });
      const result = await parser.parseStringPromise(response.data);

      const articles = [];
      const items = result.rss?.channel?.item || result.feed?.entry || result.channel?.item || [];

      const itemsArray = Array.isArray(items) ? items : [items];

      for (const item of itemsArray.slice(0, 8)) {
        // Limit per feed for quality
        const article = {
          title: this.extractText(item.title),
          link: this.extractText(item.link || item.guid),
          description: this.extractText(item.description || item.summary),
          pubDate: this.extractText(item.pubDate || item.published),
          source: new URL(feedUrl).hostname.replace("www.", ""),
          feedUrl: feedUrl,
          feedCategory: feedCategory, // Keep original feed category for reference
        };

        if (article.title && article.link && this.isValidUrl(article.link)) {
          // ✅ SMART CATEGORIZATION: Use content, not just feed source
          article.category = this.classifyArticleContent(
            article.title,
            article.description,
            null, // Content not available yet
            article.source
          );

          articles.push(article);
        }
      }

      return articles;
    } catch (error) {
      console.error(`❌ Error parsing RSS feed ${feedUrl}:`, error.message);
      return [];
    }
  }

  // ✅ UPDATED: Ingest news articles with enhanced categorization
  async ingestNews(targetCount = 150, includeCategories = ["international", "business", "technology", "regional"]) {
    try {
      console.log(`🚀 Starting enhanced news ingestion (target: ${targetCount} articles)`);

      // Ensure data directory exists
      await fs.mkdir(this.baseDir, { recursive: true });

      const feedCategories = this.getRSSFeeds();
      const allArticles = [];

      // Process each category
      for (const category of includeCategories) {
        if (!feedCategories[category]) continue;

        console.log(`📡 Processing ${category} category (${feedCategories[category].length} feeds)`);

        for (const feedUrl of feedCategories[category]) {
          if (allArticles.length >= targetCount) break;

          try {
            const feedArticles = await this.parseRSSFeed(feedUrl, category);
            allArticles.push(...feedArticles);

            console.log(`📰 ${category}: Added ${feedArticles.length} articles from ${new URL(feedUrl).hostname}`);

            // Respectful delay between feeds
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (error) {
            console.warn(`⚠️ Failed to process feed ${feedUrl}:`, error.message);
            continue;
          }

          if (allArticles.length >= targetCount) break;
        }
      }

      console.log(`📄 Total articles collected: ${allArticles.length} from ${includeCategories.length} categories`);

      // Scrape full content with enhanced error handling and re-classification
      const articlesWithContent = [];
      const maxConcurrent = 3; // Process 3 articles simultaneously

      for (let i = 0; i < Math.min(allArticles.length, targetCount); i += maxConcurrent) {
        const batch = allArticles.slice(i, i + maxConcurrent);

        const batchPromises = batch.map(async (article, index) => {
          const articleIndex = i + index + 1;
          console.log(`📖 Scraping [${articleIndex}/${Math.min(allArticles.length, targetCount)}]: ${article.title.substring(0, 60)}...`);

          try {
            const content = await this.scrapeArticleContent(article.link);
            if (content) {
              // ✅ POST-PROCESSING CLASSIFICATION: Refine category with full content
              const refinedCategory = this.classifyArticleContent(
                article.title,
                article.description,
                content, // Now we have full content
                article.source
              );

              return {
                ...article,
                content,
                category: refinedCategory, // ✅ Use content-based classification
                originalFeedCategory: article.feedCategory, // Keep for debugging
                scrapedAt: new Date().toISOString(),
                wordCount: content.split(" ").length,
              };
            }
          } catch (error) {
            console.warn(`⚠️ Failed to scrape ${article.link}: ${error.message}`);
            return null;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        const successfulArticles = batchResults.filter((result) => result.status === "fulfilled" && result.value !== null).map((result) => result.value);

        articlesWithContent.push(...successfulArticles);

        // Progress update
        console.log(`📊 Progress: ${articlesWithContent.length}/${targetCount} articles processed`);

        // Respectful delay between batches
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Enhanced article metadata
      const enhancedArticles = articlesWithContent
        .filter((article) => article && article.title) // Filter out undefined/null articles
        .map((article) => ({
          ...article,
          id: this.generateArticleId(article),
          ingestionDate: new Date().toISOString(),
          qualityScore: this.calculateQualityScore(article),
        }));

      // Save with enhanced filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `news_articles_enhanced_${timestamp}.json`;
      const filepath = path.join(this.baseDir, filename);

      await fs.writeFile(filepath, JSON.stringify(enhancedArticles, null, 2));

      // Generate summary report
      const categoryStats = this.generateCategoryStats(enhancedArticles);

      this.articles = enhancedArticles;

      console.log(`✅ Enhanced news ingestion complete!`);
      console.log(`📊 Successfully processed ${enhancedArticles.length} articles`);
      console.log(`🏷️ Categories: ${Object.keys(categoryStats).join(", ")}`);
      console.log(`💾 Saved to: ${filepath}`);
      console.log(`📈 Average quality score: ${this.calculateAverageQuality(enhancedArticles).toFixed(2)}`);

      return enhancedArticles;
    } catch (error) {
      console.error("❌ Error during enhanced news ingestion:", error);
      throw error;
    }
  }

  // ✅ NEW: Data cleanup utility for existing mislabeled articles
  async cleanupExistingData() {
    try {
      console.log("🧹 Starting data cleanup and reclassification...");

      const articles = await this.loadArticles();
      console.log(`📊 Found ${articles.length} articles to reclassify`);

      let corrected = 0;
      const correctedArticles = articles.map((article) => {
        const originalCategory = article.category;
        const newCategory = this.classifyArticleContent(article.title, article.description, article.content, article.source);

        if (originalCategory !== newCategory) {
          corrected++;
          console.log(`🔄 Reclassified "${article.title.substring(0, 50)}..." from ${originalCategory} → ${newCategory}`);
        }

        return {
          ...article,
          category: newCategory,
          originalCategory,
          reclassified: originalCategory !== newCategory,
          reclassifiedAt: new Date().toISOString(),
        };
      });

      // Save corrected data
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `news_articles_corrected_${timestamp}.json`;
      const filepath = path.join(this.baseDir, filename);
      await fs.writeFile(filepath, JSON.stringify(correctedArticles, null, 2));

      console.log(`✅ Cleanup complete! Corrected ${corrected}/${articles.length} articles`);
      console.log(`💾 Saved corrected data to: ${filepath}`);

      this.articles = correctedArticles;
      return correctedArticles;
    } catch (error) {
      console.error("❌ Error during data cleanup:", error);
      throw error;
    }
  }

  // Utility methods for enhanced processing
  generateArticleId(article) {
    // ✅ Add defensive checks
    if (!article || !article.title || !article.source || !article.pubDate) {
      console.warn("⚠️ Invalid article for ID generation:", article);
      return crypto.createHash("md5").update(`invalid-${Date.now()}`).digest("hex").substring(0, 12);
    }

    const content = `${article.title}-${article.source}-${article.pubDate}`;
    return crypto.createHash("md5").update(content).digest("hex").substring(0, 12);
  }

  calculateQualityScore(article) {
    let score = 0;

    // Title quality (20 points)
    if (article.title && article.title.length > 20) score += 20;

    // Content quality (40 points)
    if (article.content) {
      const wordCount = article.wordCount || 0;
      if (wordCount > 200) score += 20;
      if (wordCount > 500) score += 10;
      if (wordCount > 1000) score += 10;
    }

    // Source credibility (20 points)
    const trustedSources = ["bbc.co.uk", "reuters.com", "cnn.com", "nytimes.com", "apnews.com"];
    if (trustedSources.some((source) => article.source.includes(source))) {
      score += 20;
    } else {
      score += 10; // Partial credit for other sources
    }

    // Freshness (10 points)
    const pubDate = new Date(article.pubDate);
    const daysDiff = (new Date() - pubDate) / (1000 * 60 * 60 * 24);
    if (daysDiff < 1) score += 10;
    else if (daysDiff < 7) score += 5;

    // Description quality (10 points)
    if (article.description && article.description.length > 50) score += 10;

    return Math.min(score, 100);
  }

  calculateAverageQuality(articles) {
    if (!articles.length) return 0;
    const totalScore = articles.reduce((sum, article) => sum + (article.qualityScore || 0), 0);
    return totalScore / articles.length;
  }

  generateCategoryStats(articles) {
    const stats = {};
    articles.forEach((article) => {
      const category = article.category || "general";
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Load existing articles from file
  async loadArticles() {
    try {
      const files = await fs.readdir(this.baseDir);
      const jsonFiles = files.filter((f) => f.startsWith("news_articles_") && f.endsWith(".json"));

      if (jsonFiles.length === 0) {
        console.log("📄 No existing article files found");
        return [];
      }

      // Load the most recent file
      const latestFile = jsonFiles.sort().reverse()[0];
      const filepath = path.join(this.baseDir, latestFile);
      const data = await fs.readFile(filepath, "utf8");
      const articles = JSON.parse(data);

      console.log(`📚 Loaded ${articles.length} articles from ${latestFile}`);
      this.articles = articles;
      return articles;
    } catch (error) {
      console.error("❌ Error loading articles:", error);
      return [];
    }
  }

  // Get articles (load from file or ingest new)
  async getArticles(forceRefresh = false) {
    if (forceRefresh || this.articles.length === 0) {
      const existingArticles = await this.loadArticles();

      if (existingArticles.length === 0 || forceRefresh) {
        return await this.ingestNews();
      } else {
        return existingArticles;
      }
    }
    return this.articles;
  }

  // Chunk article content for embeddings
  chunkContent(content, chunkSize = 250) {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const chunks = [];

    let currentChunk = [];
    let currentLength = 0;

    for (const sentence of sentences) {
      const words = sentence.trim().split(" ");
      if (currentLength + words.length > chunkSize && currentChunk.length > 0) {
        // Add topic context to chunk
        chunks.push(currentChunk.join(".") + ".");
        currentChunk = [sentence.trim()];
        currentLength = words.length;
      } else {
        currentChunk.push(sentence.trim());
        currentLength += words.length;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(".") + ".");
    }

    return chunks.filter((chunk) => chunk.length > 100); // Ensure meaningful chunks
  }
}

const newsService = new NewsService();
export default newsService;
