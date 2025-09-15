// src/App.tsx
import React, { useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import { useSession } from "./hooks/useSession";
import "./styles/App.scss";

const ChatApp: React.FC = () => {
  const { sessionId, clearSession, isConnected } = useSession();

  const handleResetSession = async (): Promise<void> => {
    await clearSession();
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-content">
          <div className="app__title">
            <h1>News AI Assistant</h1>
            <p>Get the latest news and insights</p>
          </div>
          <div className={`app__status ${isConnected ? "connected" : "disconnected"}`}>
            <div className="status-dot"></div>
            {isConnected ? "Connected" : "Connecting..."}
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
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    // <SocketProvider>
    <ChatApp />
    // </SocketProvider>
  );
};

export default App;
