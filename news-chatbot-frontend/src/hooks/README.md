# 🧠 /src/hooks - The Logic Core

Welcome to the **brains of the operation**\! This folder contains custom React hooks, which are reusable functions that encapsulate your application's stateful logic. Think of them as **specialist strategists**—they manage complex processes like real-time chat state and user sessions, allowing your components to remain simple and focused on presentation.

## 📁 The Strategy Team

hooks/
├── 💬 useChat.ts # The real-time chat conductor
└── 👤 useSession.ts # The user session guardian

---

## 💬 `useChat.ts` - The Chat Conductor

_"The skilled operator who manages the real-time flow of a conversation from start to finish"_

This hook is the central controller for an active chat conversation. It connects to the real-time service, manages the message history, and keeps track of UI states like loading and typing indicators. It takes a `sessionId` as its only argument and handles everything else.

### 🎯 Core Responsibilities

- **Real-Time Communication:** Establishes and cleans up all necessary Socket.IO event listeners for a chat session.
- **State Management:** Manages the array of `messages`, as well as `isLoading`, `isTyping`, and `error` states.
- **History Retrieval:** Listens for the `session-history` event to populate the chat with previous messages upon joining.
- **Message Handling:** Provides a `sendMessage` function that sends user input over WebSockets and handles incoming messages via the `message-added` event.

### 🧠 Architectural Logic

- **Socket-First Design:** This hook is built exclusively for real-time communication. It does not use HTTP for chatting. All actions—sending messages, receiving history, and getting status updates—are handled through Socket.IO events for maximum speed and efficiency.
- **Event-Driven State:** The hook's state is almost entirely reactive. `messages` and other state variables are updated in response to events pushed from the server (`socket.on(...)`), creating a single source of truth for the chat's state.
- **Automatic Lifecycle Management:** Within a `useEffect` hook, it attaches all necessary listeners when the socket is ready and provides a cleanup function to detach them (`socket.off(...)`), preventing memory leaks and unwanted side effects.

### 🚀 Usage in Components

The hook is designed for simplicity. A component just needs a `sessionId` to get a fully operational chat state.

```tsx
// In a component like ChatInterface.tsx
import { useChat } from "../hooks/useChat";

const ChatInterface = ({ sessionId }) => {
  const { messages, sendMessage, isLoading, isTyping, error } = useChat(sessionId);

  // ... render the UI using these state variables and functions
};
```

---

## 👤 `useSession.ts` - The Session Guardian

_"The vigilant guardian who ensures every user has a stable and persistent identity"_

This hook's sole purpose is to manage the user's `sessionId`. It ensures that a user has a consistent ID across page loads and that their client is correctly registered with the server for their session.

### 🎯 Core Responsibilities

- **Persistent Identity:** Gets or creates a `sessionId` and persists it in `localStorage` for a seamless user experience across browser sessions.
- **Session Synchronization:** Automatically emits a `join-session` event to the server when the app loads and the socket is connected.
- **Efficient Communication:** Uses a `hasJoinedSession` flag to ensure the `join-session` event is only emitted **once** per session, preventing redundant network calls on re-renders.
- **Seamless Resets:** Provides a `clearSession` function that gracefully resets the session on the server and immediately creates a new local session to keep the app in a valid state.

### 💡 How It Works Together with `useChat`

`useSession` and `useChat` are designed to work in tandem. The flow is simple:

1.  A top-level component (like `App.tsx`) calls `useSession()` to get the essential `sessionId`.
2.  That `sessionId` is then passed as a prop to the chat component.
3.  The chat component calls `useChat(sessionId)`, using the ID to fetch and manage the state for that specific conversation.

This separation of concerns keeps the logic clean: one hook manages _who the user is_ (`useSession`), and the other manages _what they are talking about_ (`useChat`).

### 🚀 Usage in the Application Root

```tsx
// In a root component like App.tsx
import { useSession } from "../hooks/useSession";
import ChatInterface from "../components/ChatInterface";

function App() {
  const { sessionId, clearSession } = useSession();

  if (!sessionId) {
    return <div>Initializing session...</div>;
  }

  return <ChatInterface sessionId={sessionId} onResetSession={clearSession} />;
}
```

Remember: **Well-crafted hooks are the engine of your application—they power your components with clean, reusable, and powerful logic.**
