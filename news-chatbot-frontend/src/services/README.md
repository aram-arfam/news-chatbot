# 🔌 /src/services - The External Relations Department

Welcome to your **diplomatic corps**\! This folder contains the specialists who know exactly how to communicate with the outside world. Think of services as your **professional translators and ambassadors**—they speak the language of APIs and handle all the complex negotiations with external services.

## 📁 The Diplomatic Team

services/
├── 🌐 api.ts # The HTTP communication ambassador
└── 🤝 sessionService.ts # The session lifecycle coordinator (React Hook)

---

## 🌐 `api.ts` - The API Ambassador

_"The skilled diplomat who speaks fluent HTTP and knows all the backend protocols"_

This service is your **official representative** to the backend server. It provides a clean, typed interface for making traditional HTTP requests. While the app prioritizes real-time communication via WebSockets, this API service is essential for operations that follow a standard request-response pattern.

### 🎯 Core Responsibilities

- 🌐 **HTTP Client Setup:** Provides a pre-configured Axios instance with a base URL and default headers.
- 💬 **Chat API Methods:** Exports functions for sending messages and getting history over HTTP.
- 🎭 **Session Management:** Contains methods to create, clear, and fetch history for user sessions.
- 🛡️ **Type Safety:** Uses TypeScript generics (`ApiResponse<T>`) to ensure all API responses are strongly typed.

### 🔧 API Client Configuration

- **Axios Instance Setup:** A single Axios instance is created using `axios.create()`. This centralizes the `baseURL` and common headers, making API calls consistent and easy to manage.

- **Environment-Aware Configuration:** For better security and flexibility, the `BASE_URL` should be stored in an environment file (`.env`) rather than being hardcoded.

  ```typescript
  // Recommended improvement
  const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";
  ```

### 💬 Chat API Methods

- **Send Message (HTTP Fallback):** `chatApi.sendMessage` sends a user's message to the `/chat` endpoint for processing.
- **Get Chat History:** `chatApi.getHistory` retrieves the full conversation history for a given session ID.

### 🎭 Session API Methods

- **Create New Session:** `sessionApi.create` sends a request to `/session/create` to establish a new user session on the server.
- **Clear Session:** `sessionApi.clear` sends a DELETE request to remove a user's session data from the backend.

### 🎭 TypeScript Integration

- **Strongly Typed Responses:** The generic `ApiResponse<T>` type is used to wrap all responses. This provides a consistent shape and ensures that the `data` payload is type-safe, preventing common runtime errors.

- **Type-Safe Usage:**

  ```typescript
  import { chatApi } from "./api";
  import { ChatSession } from "../types";

  async function fetchHistory(sessionId: string) {
    // The 'response' variable is automatically typed as ApiResponse<ChatSession>
    const response = await chatApi.getHistory(sessionId);

    if (response.success && response.data) {
      // TypeScript knows response.data is of type ChatSession
      console.log(response.data.messages);
    }
  }
  ```

### 🔄 Service Architecture Patterns

- **API Grouping Strategy:** Functions are organized into logical objects (`chatApi`, `sessionApi`). This keeps related endpoints together, making the service easy to navigate and understand.

- **Error Handling Pattern:** This service relies on the caller to implement error handling using `try...catch` blocks. This gives the consumer (e.g., a custom hook) full control over how to manage loading states and display error messages.

### 🚀 Usage Within a Hook

```typescript
// Example of a hook using the api.ts service
import { useState } from "react";
import { sessionApi } from "./api";

function useCreateSession() {
  const [error, setError] = useState<string | null>(null);

  const createNewSession = async () => {
    try {
      const response = await sessionApi.create();
      if (response.success) {
        return response.data.sessionId;
      }
    } catch (err) {
      setError("Failed to create a new session.");
    }
  };

  return { createNewSession, error };
}
```

---

## 🤝 `sessionService.ts` - The Session Coordinator (Hook)

**Note:** This file contains the `useSession` custom React hook. Its primary role is to manage the application's session state and lifecycle, rather than just making API calls.

_"The protocol officer who manages user identity and ensures they have the right credentials for every interaction"_

The `useSession` hook is the brain behind user sessions. It orchestrates the session lifecycle by synchronizing state between React, the browser's `localStorage`, and the real-time socket server.

### 🎯 Core Responsibilities

- **Session Lifecycle Management:** Handles the creation, persistence, and clearing of the user's `sessionId`.
- **Local Persistence:** Uses `localStorage` via utility functions to remember the `sessionId` between page reloads.
- **Socket Integration:** Automatically communicates with the WebSocket server to `join-session` as soon as a connection is established.
- **Simplified Interface:** Exposes a clean hook that provides the current `sessionId` and methods like `createSession` and `clearSession` to components.

### 🧠 Architectural Approach

The hook uses a hybrid strategy for managing sessions:

- **On Initial Load:** It retrieves or creates a session ID from `localStorage` to ensure persistence.
- **For Real-Time Sync:** It uses the `SocketContext` to emit events like `join-session` and `reset-session`, keeping the server aware of the client's state. This is the primary communication method for session management.

While this hook _could_ use the `sessionApi` from `api.ts` for certain actions, the current implementation prioritizes the WebSocket connection for a more responsive, real-time experience.

---

Remember: **Good services are like professional diplomats—they handle complex external negotiations with clear protocols so the rest of your app doesn't have to.**
