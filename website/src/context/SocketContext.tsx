"use client";

/**
 * SocketContext — Singleton Socket.IO connection for the entire app.
 *
 * - Admins call joinAsAdmin(token) after login to subscribe to the admin room.
 * - Customers call joinAsUser(userId, token) for personal order updates.
 * - On reconnect the context automatically re-joins any previously joined rooms.
 * - Socket is lazy-initialised only on first context use (SSR safe).
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinAsAdmin: (token: string) => void;
  joinAsUser: (userId: string, token: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  joinAsAdmin: () => {},
  joinAsUser: () => {},
});

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:5000";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedRoomsRef = useRef<{ type: "admin" | "user"; userId?: string; token?: string } | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("[SOCKET] Connected:", socket.id);
      const rooms = joinedRoomsRef.current;
      if (rooms?.type === "admin" && rooms.token) {
        socket.emit("admin:join", { token: rooms.token });
      } else if (rooms?.type === "user" && rooms.userId && rooms.token) {
        socket.emit("user:join", { userId: rooms.userId, token: rooms.token });
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[SOCKET] Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.warn("[SOCKET] Connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    };
  }, []);

  const joinAsAdmin = useCallback((token: string) => {
    joinedRoomsRef.current = { type: "admin", token };
    socketRef.current?.emit("admin:join", { token });
  }, []);

  const joinAsUser = useCallback((userId: string, token: string) => {
    joinedRoomsRef.current = { type: "user", userId, token };
    socketRef.current?.emit("user:join", { userId, token });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketInstance,
        isConnected,
        joinAsAdmin,
        joinAsUser,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
