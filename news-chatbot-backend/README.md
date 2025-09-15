# 🤖 News AI Chatbot - Backend

Welcome to the backend for the News AI Chatbot. This is a powerful, AI-driven server that delivers intelligent, real-time news responses using a sophisticated **RAG (Retrieval-Augmented Generation)** pipeline. Think of it as your personal news assistant that not only remembers everything it reads but can also have meaningful conversations about current events.

This server powers a conversational news chatbot that:

- **Ingests** the latest news from trusted sources across the globe.
- **Understands** your questions using advanced AI embeddings.
- **Retrieves** relevant context from its knowledge base.
- **Generates** intelligent, contextual responses using Google's Gemini AI.
- **Remembers** your conversation history in real-time sessions using a Redis cache.

---

## 🏗️ Architecture Overview

The backend is the core of the application, orchestrating data flow between the user, the AI models, the vector database, and the cache.

    A[🌐 Frontend Client] -- Socket.IO & HTTP --> B{Node.js Server};
    B -- "User Query" --> C[🧠 RAG Pipeline];
    C -- "Search Vector" --> D[📚 Qdrant Vector DB];
    D -- "Relevant Articles" --> C;
    C -- "Context + Query" --> E[🤖 Google Gemini AI];
    E -- "Generated Response" --> C;
    C -- "Final Message" --> B;
    B -- "Store Session" --> F[⚡ Redis Cache];
    F -- "Retrieve History" --> B;
    B -- "Real-time Message" --> A;

---

## 🛠️ Tech Stack

| Category        | Technology                                |
| --------------- | ----------------------------------------- |
| Core Runtime    | Node.js, Express.js                       |
| Real-time       | Socket.IO                                 |
| AI & Embeddings | Google Gemini AI, Jina AI Embeddings      |
| Vector Search   | Qdrant Vector Database                    |
| Caching         | Redis Cloud                               |
| Data Sources    | RSS Feeds (BBC, Reuters, TechCrunch,etc.) |
| Language        | JavaScript                                |

## 🚀 Getting Started

Follow these instructions to get the backend server running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- NPM or Yarn
- Active accounts and API keys for:
  - Google AI Studio (for Gemini)
  - Jina AI
  - Qdrant Cloud
  - Redis Cloud

### 1\. Clone the Repository

git clone <your-repository-url>
cd news-chatbot-backend

### 2\. Install Dependencies

npm install

### 3\. Configure Environment

Copy the example environment file and fill it in with your credentials.

```sh
cp .env.example .env
```

Open the `.env` file and add your secret keys and configuration details:

# 🤖 AI Services

GEMINI_API_KEY=your_gemini_api_key_here
JINA_API_KEY=your_jina_api_key_here

# 📊 Vector Database

QDRANT_URL=https://your-cluster.qdrant.tech:6333
QDRANT_API_KEY=your_qdrant_api_key_here
COLLECTION_NAME=news_articles

# ⚡ Redis Cache

REDIS_HOST=your-redis-cloud-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 🔧 App Configuration

PORT=3001
NODE_ENV=development

### 4\. Run the Application

First, start the server in development mode, which includes auto-reloading with `nodemon`.

```sh
npm run dev
```

The server will start, but the knowledge base will be empty. Next, you need to trigger the initial data ingestion and embedding process.

### 5\. Build the Knowledge Base

Open a separate terminal and use the following command to start the RAG pipeline build. This command tells the server to fetch, process, and embed the latest news articles into the Qdrant vector database.

```sh
curl -X POST http://localhost:3001/api/chat/rebuild
```

The initial build takes approximately **5-10 minutes** and ingests around 150 recent news articles. You can monitor its progress by calling the status endpoint:

```sh
curl http://localhost:3001/api/chat/status
```

Once the `initialized` status is `true`, your chatbot is ready to answer questions\!

---

## 🧠 Caching Strategy

To ensure low latency and reduce redundant computations, this backend uses **Redis** as an in-memory cache.

- **Purpose:** The primary goal is to cache user session histories. Retrieving a full conversation from a primary database can be slow. By storing messages in Redis, we can fetch a user's entire chat history almost instantly when they reconnect.

- **Time-To-Live (TTL):** Each session stored in Redis has a **TTL of 24 hours (86400 seconds)**. This means if a user is inactive for more than a day, their session data is automatically purged from the cache. This strikes a balance between providing a persistent experience for active users and managing memory efficiently. When a user sends a new message, the TTL for their session is refreshed.

- **Cache Invalidation:** The cache is updated in real-time. When a new user or AI message is generated for a session, the updated message list is immediately written back to Redis, ensuring the cache is always up-to-date.

---

## 🔌 API Endpoint Documentation

### Health & Status

#### `GET /api/health`

Checks the health of the server and its connections to external services.

- **Success Response (200):**
  ```json
  {
    "status": "OK",
    "services": {
      "redis": "connected",
      "vectorDb": "connected"
    }
  }
  ```

### Session Management

#### `POST /api/session/create`

Creates a new, empty chat session. (Note: The frontend primarily handles session creation client-side, but this endpoint is available).

- **Success Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "sessionId": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
      "createdAt": "2025-09-15T16:30:00.000Z"
    }
  }
  ```

#### `GET /api/session/:sessionId/history`

Retrieves the full chat history for a given session.

- **Success Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "sessionId": "a1b2c3d4-...",
      "messages": [
        {
          "id": "msg_1",
          "role": "user",
          "content": "What's the latest in tech?",
          "timestamp": "2025-09-15T16:31:00.000Z"
        }
      ]
    }
  }
  ```

### Chat & RAG Pipeline

#### `POST /api/chat`

Sends a message to the RAG pipeline for processing (primarily for HTTP-based testing).

- **Request Body:**
  ```json
  {
    "sessionId": "a1b2c3d4-...",
    "message": "Tell me about the recent AI advancements."
  }
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "botResponse": "Recently, there have been several breakthroughs in AI...",
      "sources": [{ "title": "New AI Model Shatters Records", "source": "TechCrunch" }]
    }
  }
  ```

#### `POST /api/chat/rebuild`

Triggers a full rebuild of the news knowledge base. This is an asynchronous operation.

- **Success Response (202 - Accepted):**
  ```json
  {
    "message": "Knowledge base rebuild process started."
  }
  ```

---

## 💬 Real-Time Events (Socket.IO)

The primary communication channel is Socket.IO.

### Events Listened For by the Server

- `join-session` (payload: `sessionId`): A user joins a room to receive real-time updates for their session. The server responds with the `session-history` event.
- `chat-message` (payload: `{ sessionId, message }`): A user sends a new message. The server processes it through the RAG pipeline.
- `reset-session` (payload: `sessionId`): A user requests to clear their session history.

### Events Emitted by the Server

- `session-history` (payload: `{ messages: [] }`): Sent to a user immediately after they `join-session`, providing the full conversation history from the cache.
- `bot-typing` (payload: `true` or `false`): Informs the client that the bot has started or finished processing a response.
- `message-added` (payload: `ChatMessage`): A new message (either from the user or the AI) is broadcast to the session room.
- `error` (payload: `{ message: "Error details" }`): Sent if an error occurs during message processing.
