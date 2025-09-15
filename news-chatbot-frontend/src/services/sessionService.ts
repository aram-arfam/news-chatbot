import { useState, useEffect, useCallback } from "react";
import { UseSessionReturn } from "../types";
import { getOrCreateSessionId, clearSessionId, setSessionId } from "../utils/sessionUtils";
import { useSocket } from "../context/SocketContext";

export const useSession = (): UseSessionReturn => {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();

  // Initialize session ID from localStorage
  useEffect(() => {
    const existingSessionId = getOrCreateSessionId();
    setSessionIdState(existingSessionId);
  }, []);

  // Join session when socket connects and sessionId is available
  useEffect(() => {
    if (socket && isConnected && sessionId) {
      console.log(`🔌 Joining session: ${sessionId}`);
      socket.emit("join-session", sessionId);
    }
  }, [socket, isConnected, sessionId]);

  const createSession = useCallback(async (): Promise<void> => {
    try {
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      setSessionIdState(newSessionId);

      // Join the new session via socket
      if (socket && isConnected) {
        socket.emit("join-session", newSessionId);
      }

      console.log(`✅ Created new session: ${newSessionId}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }, [socket, isConnected]);

  const clearSession = useCallback(async (): Promise<void> => {
    if (!sessionId) return;

    try {
      // Clear on server via socket
      if (socket) {
        socket.emit("reset-session", sessionId);
      }

      // Clear locally
      clearSessionId();
      setSessionIdState(null);

      console.log(`🗑️ Cleared session: ${sessionId}`);
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  }, [sessionId, socket]);

  const loadHistory = useCallback(async (): Promise<void> => {
    // History loading now handled via socket 'session-history' event
    // This is automatically triggered when joining a session
    if (socket && sessionId) {
      socket.emit("join-session", sessionId);
    }
  }, [sessionId, socket]);

  return {
    sessionId,
    createSession,
    clearSession,
    loadHistory,
    isConnected,
  };
};
