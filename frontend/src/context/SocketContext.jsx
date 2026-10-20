import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const SocketContext = createContext(null);

export const SOCKET_EVENTS = {
    // Client to Server
    JOIN_ADMIN: "join_admin",
    JOIN_USER: "join_user",
    LEAVE_USER: "leave_user",

    // Server to Client
    ORDER_NEW: "order:new",
    ORDER_STATUS_UPDATED: "order:status_updated",
    ORDER_CANCELLED: "order:cancelled",

    PRESCRIPTION_NEW: "prescription:new",
    PRESCRIPTION_STATUS_UPDATED: "prescription:status_updated",
    PRESCRIPTION_DELETED: "prescription:deleted",
};

export const SocketProvider = ({ children }) => {
    const [connection, setConnection] = useState(null);
    const { user } = useSelector((state) => state.auth);
    const userId = user?._id;
    const userRole = user?.role;
    const socket = connection && connection.userId === userId && connection.userRole === userRole
        ? connection.socket : null;
    const isConnected = Boolean(socket?.connected);

    useEffect(() => {
        if (!userId) return;
        // Connect to root namespace via proxy or direct URL
        const backendUrl =
            import.meta.env.VITE_SOCKET_URL ||
            (window.location.hostname === "localhost" ? "http://localhost:3000" : window.location.origin);

        const socketInstance = io(backendUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
        });

        socketInstance.on("connect", () => {
            console.log("[Socket.io] Connected to server successfully (ID:", socketInstance.id, ")");
            setConnection({ socket: socketInstance, userId, userRole });

            // Resilient admin room check
            if (userRole === "admin") {
                socketInstance.emit(SOCKET_EVENTS.JOIN_ADMIN);
            }
            socketInstance.emit(SOCKET_EVENTS.JOIN_USER, userId);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("[Socket.io] Disconnected from server:", reason);
            setConnection((current) => current?.socket === socketInstance ? { ...current } : current);
            if (reason === "io server disconnect") socketInstance.connect();
        });

        socketInstance.on("connect_error", (error) => {
            console.warn("[Socket.io] Connection error:", error.message);
        });

        return () => {
            socketInstance.removeAllListeners();
            socketInstance.disconnect();
        };
    }, [userId, userRole]);

    const joinAdmin = () => {
        if (socket && socket.connected) {
            socket.emit(SOCKET_EVENTS.JOIN_ADMIN);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, SOCKET_EVENTS, joinAdmin }}>
            {children}
        </SocketContext.Provider>
    );
};

/**
 * Custom hook to consume the Socket instance and events in any component
 */
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
