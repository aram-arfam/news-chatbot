// context/SocketContext.tsx - IMPROVED VERSION
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const initializingRef = useRef(false); // ✅ Prevent multiple initializations

  useEffect(() => {
    // ✅ Prevent multiple socket connections
    if (initializingRef.current || socket) return;

    initializingRef.current = true;
    console.log("🔌 Creating single socket connection...");

    const newSocket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      // ✅ Add these options to improve connection stability
      forceNew: false,
      multiplex: true,
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to server:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason, details) => {
      console.log("❌ Disconnected:", reason, details);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection");
      initializingRef.current = false;
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, []); // ✅ Empty dependency array - create socket only once

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
