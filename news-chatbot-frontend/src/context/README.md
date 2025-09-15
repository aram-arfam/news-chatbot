# 🌐 /src/context - The Communication Hub

Welcome to your application's **central nervous system**\! Think of React Context as the **company-wide intercom system**—it ensures that important information (like your Socket.IO connection) reaches every part of your app that needs it, without having to pass messages down through every single component.

## 📁 What Lives Here

context/
└── 🔌 SocketContext.tsx # Manages the real-time WebSocket connection

## 🔌 `SocketContext.tsx` - The Connection Orchestrator

_"The master communications officer who keeps everyone connected in real-time"_

This context provider acts as a dedicated manager for your real-time connection. It ensures that a **single, stable Socket.IO instance** is created and made available throughout your app, preventing the common pitfalls of duplicate connections and memory leaks.

### 🎯 Core Responsibilities

- 🔌 **Single Socket Instance:** Establishes one, and only one, connection to the server for the entire application lifecycle.
- 🌐 **Global Availability:** Makes the `socket` instance and its connection status (`isConnected`) accessible to any component via the `useSocket` hook.
- 🔄 **Connection Management:** Automatically handles `connect`, `disconnect`, and `connect_error` events, updating the connection status in real-time.
- 🛡️ **Error & Leak Prevention:** Implements guards and cleanup logic to prevent duplicate connections (even in React's Strict Mode) and memory leaks.
- 📊 **Status Monitoring:** Provides a simple boolean (`isConnected`) for any component to reactively check the connection's health.

### 🧠 The Smart Connection Logic

The context uses a combination of React hooks to create a robust, self-managing connection.

- **Single Connection Strategy:**
  The connection logic is placed inside a `useEffect` hook with an **empty dependency array** (`[]`). This ensures the code runs only once when the `SocketProvider` is first mounted. An additional `initializingRef` guard prevents the effect from running twice during development due to React's Strict Mode.

- **Connection Event Management:**
  Once the socket is created, it immediately subscribes to core Socket.IO events (`connect`, `disconnect`, `connect_error`). These listeners update the shared `isConnected` state, allowing any component consuming the context to react instantly to changes in connection status.

- **Proper Cleanup:**
  The `useEffect` hook returns a cleanup function. This function is executed when the `SocketProvider` unmounts, calling `newSocket.disconnect()` to gracefully close the connection and prevent orphaned connections and memory leaks.

### 🎭 Context Pattern Implementation

- **Provider Setup:**
  The `SocketProvider` component wraps your application's component tree. Any child component can now access the socket instance. This is typically done in your main entry file (`App.tsx` or `main.tsx`).

  ```tsx
  // In your main App.tsx or equivalent root component
  import React from "react";
  import { SocketProvider } from "./context/SocketContext";
  import YourAppComponent from "./YourAppComponent";

  function App() {
    return (
      <SocketProvider>
        <YourAppComponent />
      </SocketProvider>
    );
  }

  export default App;
  ```

- **Custom Hook for Easy Access:**
  The `useSocket` hook provides a clean and simple way for components to access the context's value (`{ socket, isConnected }`). It also includes an error check to ensure the component is wrapped within a `SocketProvider`.

### 🔄 How Components Use It

- **In Any Component:**
  Simply call the `useSocket` hook to get the socket instance and connection status. You can then use it to emit events or set up listeners.

  ```tsx
  // In a component like Chat.tsx
  import React, { useEffect, useState } from "react";
  import { useSocket } from "../context/SocketContext";

  const ChatComponent = () => {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
      // Do not set up listeners if socket is not available
      if (!socket) return;

      const messageListener = (newMessage: string) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      };

      // Listen for new messages
      socket.on("receive_message", messageListener);

      // ✅ Crucial: Cleanup listener on component unmount
      return () => {
        socket.off("receive_message", messageListener);
      };
    }, [socket]); // Re-run effect if socket instance changes

    const sendMessage = () => {
      if (socket && isConnected) {
        socket.emit("send_message", "Hello, server!");
      }
    };

    return (
      <div>
        <p>Connection Status: {isConnected ? "✅ Connected" : "❌ Disconnected"}</p>
        <button onClick={sendMessage} disabled={!isConnected}>
          Send Message
        </button>
        <div>
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
      </div>
    );
  };
  ```

## 🛡️ Protection Features

### 1\. **Duplicate Connection Prevention**

A `useRef` flag (`initializingRef`) is used to guard against the double-invocation of `useEffect` in React's Strict Mode, ensuring the `io()` connection is only ever called once.

### 2\. **Memory Leak Prevention**

The cleanup function within `useEffect` guarantees that the socket connection is properly terminated (`newSocket.disconnect()`) when the provider is no longer in use, preventing resource leaks.

### 3\. **Connection Health Monitoring**

The `isConnected` boolean provides a reliable, real-time flag. Components can use this to conditionally render UI or prevent actions (like sending a message) when the application is offline.

---

## 🔧 Configuration Options

### Socket.IO Client Configuration

The socket instance is initialized with options to improve stability and performance.

- `transports: ["websocket", "polling"]`: Prioritizes the WebSocket protocol but provides polling as a fallback.
- `timeout: 20000`: Sets a 20-second timeout for the connection.
- `forceNew: false` & `multiplex: true`: Encourages reusing an existing connection, which is key to the single-socket strategy.

### Environment-Based Configuration

For flexibility, you can use environment variables to configure the server URL.

```tsx
// Example using environment variables
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:3001";
const newSocket = io(SOCKET_URL, {
  /* ...options */
});
```

---

## 🎯 Best Practices

### 1\. **Single Provider Rule**

Wrap your application root with `SocketProvider` **once**. Placing multiple providers will violate the single-connection principle and create unexpected behavior.

### 2\. **Conditional Usage**

Always check if `socket` exists and if `isConnected` is `true` before attempting to emit events. This prevents errors when the component renders before the connection is established or after it has been lost.

### 3\. **Event Listener Cleanup**

When a component uses `socket.on()`, it **must** clean up that specific listener using `socket.off()` in the return function of its `useEffect`. Failing to do so will create memory leaks and cause the same listener to be attached multiple times.

---

## 🐛 Troubleshooting

### Connection Not Establishing

- Check the server URL in `SocketContext.tsx` and ensure it is correct.
- Verify that your backend Socket.IO server is running and accessible.
- Look for `connect_error` logs in your browser's developer console for detailed error messages.

### Multiple Connections Created

- Ensure you only have **one** `<SocketProvider>` wrapping your component tree.
- Confirm that the `useEffect` dependency array in `SocketContext.tsx` is empty (`[]`).

### Events Not Working

- Confirm the component where you are using `socket.on` or `socket.emit` is a child of `<SocketProvider>`.
- Double-check that the event names (`'send_message'`) exactly match between your client and server code.
- Use the `isConnected` flag to ensure you are not trying to interact with the socket before it's connected.

_Remember: Context is like having a company-wide announcement system—everyone can hear important updates without having to pass messages person by person\!_ 📢
