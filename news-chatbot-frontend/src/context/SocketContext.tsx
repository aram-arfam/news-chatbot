import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import io from "socket.io-client";
import { debugLog, criticalLog, criticalError } from "../utils/logger";

type Socket = ReturnType<typeof io>;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: "connecting",
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const initializingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple socket connections
    if (initializingRef.current || socket) return;

    initializingRef.current = true;
    debugLog("🔌 Creating single socket connection...");

    const newSocket: Socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: false,
      multiplex: true,
      autoConnect: true,
      // Production-specific additions
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // ✅ All event listeners with proper TypeScript types
    newSocket.on("connect", () => {
      criticalLog("✅ Connected to server:", newSocket.id);
      setIsConnected(true);
      setConnectionStatus("connected");
    });

    newSocket.on("disconnect", (reason: string, details?: any) => {
      criticalLog("❌ Disconnected:", reason, details);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    });

    newSocket.on("connect_error", (error: Error) => {
      criticalError("❌ Connection error:", error);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    });

    newSocket.on("reconnect_attempt", (attemptNumber: number) => {
      debugLog(`🔄 Reconnection attempt ${attemptNumber}`);
      setConnectionStatus("connecting");
    });

    newSocket.on("reconnect_failed", () => {
      debugLog("❌ Failed to reconnect");
      setConnectionStatus("disconnected");
    });

    newSocket.on("reconnect", (attemptNumber: number) => {
      criticalLog(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionStatus("connected");
    });

    setSocket(newSocket);

    return () => {
      debugLog("🧹 Cleaning up socket connection");
      initializingRef.current = false;
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus("connecting");
    };
  }, []);

  return <SocketContext.Provider value={{ socket, isConnected, connectionStatus }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
