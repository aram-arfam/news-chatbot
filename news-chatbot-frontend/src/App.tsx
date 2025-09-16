// src/App.tsx
import React from "react";
import ChatInterface from "./components/ChatInterface";
import { useSession } from "./hooks/useSession";
import { SocketProvider, useSocket } from "./context/SocketContext";
import "./styles/App.scss";

const ChatApp: React.FC = () => {
  const { sessionId, clearSession } = useSession();
  const { isConnected, connectionStatus } = useSocket(); // Enhanced connection info

  const handleResetSession = async (): Promise<void> => {
    await clearSession();
  };

  // Enhanced status display
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case "connected":
        return { text: "Connected", className: "connected" };
      case "connecting":
        return { text: "Connecting...", className: "connecting" };
      case "disconnected":
        return { text: "Connection lost", className: "disconnected" };
      default:
        return { text: "Connecting...", className: "connecting" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-content">
          <div className="app__title">
            <h1>News AI Assistant</h1>
            <p>Get the latest news and insights</p>
          </div>
          <div className={`app__status ${statusInfo.className}`}>
            <div className="status-dot"></div>
            {statusInfo.text}
          </div>
        </div>
      </header>

      <main className="app__main">
        {sessionId ? (
          <ChatInterface sessionId={sessionId} onResetSession={handleResetSession} />
        ) : (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Initializing chat session...</p>
          </div>
        )}

        {/* Enhanced connection feedback */}
        {connectionStatus === "disconnected" && <div className="connection-warning">⚠️ Connection lost. Attempting to reconnect...</div>}
      </main>
    </div>
  );
};

// ✅ CRITICAL: SocketProvider must be uncommented
const App: React.FC = () => {
  return (
    <SocketProvider>
      <ChatApp />
    </SocketProvider>
  );
};

export default App;
