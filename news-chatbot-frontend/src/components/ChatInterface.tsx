import React from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useChat } from "../hooks/useChat";
import { ChatInterfaceProps } from "../types";
import "../styles/components/chat-interface.scss";

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, onResetSession }) => {
  const { messages, sendMessage, isLoading, isTyping, error, clearError } = useChat(sessionId);

  const handleSendMessage = async (message: string): Promise<void> => {
    clearError();
    await sendMessage(message);
  };

  const handleReset = async (): Promise<void> => {
    await onResetSession();
  };

  return (
    <div className="chat-interface">
      <div className="chat-interface__header">
        <h2>Chat with News AI</h2>
        <button className="chat-interface__reset-btn" onClick={handleReset} disabled={isLoading} type="button">
          🔄 Reset Chat
        </button>
      </div>

      {error && (
        <div className="chat-interface__error">
          <span>❌ {error}</span>
          <button onClick={clearError} type="button">
            ✕
          </button>
        </div>
      )}

      <div className="chat-interface__messages">
        <MessageList messages={messages} isTyping={isTyping} />
      </div>

      <div className="chat-interface__input">
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} placeholder="Ask me about the latest news..." />
      </div>
    </div>
  );
};

export default ChatInterface;
