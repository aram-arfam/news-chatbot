import React, { useEffect, useRef, useState } from "react";
import TypingIndicator from "./TypingIndicator";
import { MessageListProps, ChatMessage } from "../types";
import "../styles/components/message-list.scss";

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessages, setStreamingMessages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Typewriter effect for bot messages
  useEffect(() => {
    const botMessages = messages.filter((msg) => msg.role === "assistant" && !streamingMessages[msg.id]);

    botMessages.forEach((message) => {
      if (message.content && !streamingMessages[message.id]) {
        simulateTyping(message.id, message.content);
      }
    });
  }, [messages]);

  const simulateTyping = (messageId: string, content: string) => {
    let currentIndex = 0;
    const typingSpeed = 30; // milliseconds per character

    const typeInterval = setInterval(() => {
      if (currentIndex <= content.length) {
        setStreamingMessages((prev) => ({
          ...prev,
          [messageId]: content.slice(0, currentIndex),
        }));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setStreamingMessages((prev) => ({
          ...prev,
          [messageId]: content,
        }));
      }
    }, typingSpeed);
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message: ChatMessage): JSX.Element => {
    const displayContent = message.role === "assistant" ? streamingMessages[message.id] || "" : message.content;

    return (
      <div key={message.id} className={`message message--${message.role}`}>
        <div className="message__avatar">{message.role === "user" ? "👤" : "🤖"}</div>

        <div className="message__content">
          <div className="message__bubble">
            <div className="message__text">
              {displayContent}
              {message.role === "assistant" && streamingMessages[message.id] !== message.content && <span className="typing-cursor">|</span>}
            </div>

            {message.sources && message.sources.length > 0 && streamingMessages[message.id] === message.content && (
              <div className="message__sources">
                <p className="sources-title">📰 Sources:</p>
                <ul>
                  {message.sources.map((source, index) => (
                    <li key={index}>
                      <strong>{source.title}</strong>
                      <span className="source-info">
                        from {source.source} (relevance: {Math.round(source.score * 100)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="message__time">{formatTime(message.timestamp)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="message-list__empty">
          <div className="welcome-message">
            <h3>Welcome to News Chatbot!</h3>
            <p>Ask me about the latest technology news, world events, or any current topics.</p>
            <div className="sample-questions">
              <p>
                <strong>Try asking:</strong>
              </p>
              <ul>
                <p>"What's the latest technology news?"</p>
                <p>"Tell me about recent world events"</p>
                <p>"What's happening in business today?"</p>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        messages.map(renderMessage)
      )}

      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
