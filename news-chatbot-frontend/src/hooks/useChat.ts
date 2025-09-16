// hooks/useChat.ts - ENHANCED for Socket.io primary usage
import { useState, useEffect, useCallback } from "react";
import { ChatMessage, UseChatReturn } from "../types";
import { useSocket } from "../context/SocketContext";
import { debugLog, criticalLog, criticalError } from "../utils/logger";

export const useChat = (sessionId: string): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleSessionHistory = (history: any) => {
      debugLog("📚 Received chat history via Socket.io:", history);
      setIsLoading(false);

      if (history && history.exists && history.messages) {
        const formattedMessages: ChatMessage[] = history.messages.map((msg: any) => ({
          id: msg.messageId || msg.id || `msg-${Date.now()}`,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: msg.timestamp,
          sources: msg.sources || [],
        }));

        formattedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    };

    const handleMessageAdded = (message: any) => {
      debugLog("📥 New message via Socket.io:", message);

      const formattedMessage: ChatMessage = {
        id: message.messageId || `msg-${Date.now()}-${Math.random()}`,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        sources: message.sources || [],
      };

      setMessages((prev) => {
        const exists = prev.some((msg) => msg.content === formattedMessage.content && msg.role === formattedMessage.role && Math.abs(new Date(msg.timestamp).getTime() - new Date(formattedMessage.timestamp).getTime()) < 1000);
        if (exists) return prev;
        return [...prev, formattedMessage];
      });

      if (message.role === "assistant") {
        setIsTyping(false);
        setIsLoading(false);
      }
    };

    const handleBotTyping = (typing: boolean) => {
      debugLog("🤖 Bot typing status:", typing);
      setIsTyping(typing);
    };

    const handleError = (error: any) => {
      criticalError("Socket error:", error);
      setError(error.message || "Connection error occurred");
      setIsLoading(false);
      setIsTyping(false);
    };

    const handleSessionReset = () => {
      debugLog("🔄 Session reset received via Socket.io");
      setMessages([]);
      setError(null);
    };

    // Attach listeners
    socket.on("session-history", handleSessionHistory);
    socket.on("message-added", handleMessageAdded);
    socket.on("bot-typing", handleBotTyping);
    socket.on("error", handleError);
    socket.on("session-reset", handleSessionReset);

    return () => {
      socket.off("session-history", handleSessionHistory);
      socket.off("message-added", handleMessageAdded);
      socket.off("bot-typing", handleBotTyping);
      socket.off("error", handleError);
      socket.off("session-reset", handleSessionReset);
    };
  }, [socket]);

  //  Join session when ready
  useEffect(() => {
    if (sessionId && socket && isConnected) {
      debugLog(`🔍 Joining session via Socket.io: ${sessionId}`);
      setIsLoading(true);
      socket.emit("join-session", sessionId);
    }
  }, [sessionId, socket, isConnected]);

  //  Send message via Socket.io
  const sendMessage = useCallback(
    async (messageText: string): Promise<void> => {
      if (!messageText.trim() || !socket || !sessionId) return;

      setIsLoading(true);
      setIsTyping(true);
      setError(null);

      try {
        socket.emit("chat-message", {
          sessionId: sessionId,
          message: messageText.trim(),
        });
      } catch (err) {
        criticalError("Error sending message:", err);
        setError("Failed to send message");
        setIsLoading(false);
        setIsTyping(false);
      }
    },
    [sessionId, socket]
  );

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    isTyping,
    error,
    clearError,
  };
};
