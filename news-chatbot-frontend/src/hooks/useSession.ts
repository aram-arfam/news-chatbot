// hooks/useSession.ts - FIXED VERSION
import { useState, useEffect, useCallback } from "react";
import { UseSessionReturn } from "../types";
import { getOrCreateSessionId, clearSessionId } from "../utils/sessionUtils";
import { useSocket } from "../context/SocketContext";
import { debugLog, criticalError } from "../utils/logger";

export const useSession = (): UseSessionReturn => {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [hasJoinedSession, setHasJoinedSession] = useState(false);
  const { socket, isConnected } = useSocket();

  // Just use localStorage, no HTTP validation
  useEffect(() => {
    const existingSessionId = getOrCreateSessionId();
    debugLog(`📋 Using consistent session ID: ${existingSessionId}`);
    setSessionIdState(existingSessionId);
  }, []); // Empty dependency array - run once

  // Join session only once per session
  useEffect(() => {
    if (socket && isConnected && sessionId && !hasJoinedSession) {
      debugLog(`🔌 Joining session once: ${sessionId}`);
      socket.emit("join-session", sessionId);
      setHasJoinedSession(true);
    }
  }, [socket, isConnected, sessionId, hasJoinedSession]);

  // Reset join status when session changes
  useEffect(() => {
    if (sessionId) {
      setHasJoinedSession(false);
    }
  }, [sessionId]);

  const clearSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !socket) return;

    try {
      socket.emit("reset-session", sessionId);
      clearSessionId();
      setHasJoinedSession(false);

      const newSessionId = getOrCreateSessionId();
      setSessionIdState(newSessionId);

      debugLog(`🗑️ Session cleared and recreated: ${newSessionId}`);
    } catch (error) {
      criticalError("Failed to clear session:", error);
    }
  }, [sessionId, socket]);

  return {
    sessionId,
    createSession: async () => {},
    clearSession,
    loadHistory: async () => {},
    isConnected,
  };
};
