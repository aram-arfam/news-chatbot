# 📜 /src/types - The Application's Constitution

Welcome to the **single source of truth** for your application's data structures. This folder contains the "constitution" or "dictionary" for your entire project. Every piece of data, from a chat message to a component's props, has its shape and contract defined here.

Think of this file as the **master blueprint** for a complex engineering project. Before anyone can build a part, they must consult the blueprint to ensure it will fit perfectly with everything else. This guarantees consistency, prevents errors, and makes the entire system predictable.

## 📁 The Law of the Land

types/
└── 📜 index.ts # The single source of truth for all data structures

---

## 🏛️ Why a Centralized Type File?

- **Single Source of Truth:** By defining all types in one place, we eliminate ambiguity and prevent duplicate or conflicting definitions. If the shape of a message changes, we only need to update it here.
- **Ironclad Consistency:** It ensures that the data sent by the API, managed by the hooks, and rendered by the components all adhere to the exact same structure.
- **Enhanced Developer Experience:** TypeScript's static analysis provides intelligent autocompletion and compile-time error checking, catching bugs before they ever happen.
- **Clear Contracts:** This file explicitly defines the "contracts" between different parts of your application. You know exactly what props a component expects and what data a hook will return.

---

## 📖 A Tour of the Application's Blueprints

The `index.ts` file is organized into logical sections, each defining a core part of the application's data.

### 1\. Core Message Types

These are the fundamental building blocks of any conversation.

- `MessageRole`: A simple union type (`"user" | "assistant"`) that defines who sent a message.
- `Source`: An interface for citation data, giving credibility to the AI's responses.
- `ChatMessage`: The most important interface. It defines the structure of a single message bubble in the chat, including its ID, role, content, and timestamp.

### 2\. Session Types

This defines the structure of an entire conversation.

- `ChatSession`: Represents a complete chat session, containing its unique ID, creation date, and an array of all `ChatMessage` objects associated with it.

### 3\. API Response Types

These interfaces define the contract with the backend API.

- `ApiResponse<T>`: A generic wrapper for all HTTP responses. It standardizes the response structure with a `success` flag and an optional `data` payload, making API handling predictable.
- `ChatResponse`: A specific data type for the payload when a new chat message is successfully processed by the API.

### 4\. Component Prop Types

These define the "public API" for each React component, ensuring they receive the correct data and functions.

- `ChatInterfaceProps`: Defines what the main `ChatInterface` component needs to operate.
- `MessageListProps`: Specifies that the `MessageList` component must receive an array of `ChatMessage`s and the `isTyping` status.
- `MessageInputProps`: Dictates the props required by the `MessageInput` component, including the crucial `onSendMessage` callback.

### 5\. Hook Types

These define the return shape of your custom hooks, making their output predictable and easy to use.

- `UseChatReturn`: The contract for the `useChat` hook. Any component using this hook knows it will receive `messages`, a `sendMessage` function, `isLoading` status, etc.
- `UseSessionReturn`: The contract for the `useSession` hook, guaranteeing it provides a `sessionId` and functions to manage the session.

---

### 🌐 The Flow of Data Consistency

These types work together to create a chain of consistency that flows through the entire application:

1.  The `api.ts` service makes an HTTP call that is typed to return a `Promise<ApiResponse<ChatResponse>>`.
2.  The `useChat` hook calls this service and processes the response, storing the data in a state variable typed as `ChatMessage[]`.
3.  The hook returns this data as part of its `UseChatReturn` object.
4.  The `ChatInterface` component consumes this hook and passes the `messages` array down to the `MessageList` component.
5.  `MessageList` accepts this data because its `MessageListProps` contract specifies a `messages: ChatMessage[]` property.

Any break in this chain would be caught by the TypeScript compiler instantly.

---

Remember: **Strong types are not just about preventing errors; they are about creating a self-documenting, predictable, and maintainable codebase.**
