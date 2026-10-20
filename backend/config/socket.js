import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { connectToDB, getLocalUserModel } from "./localDb.js";
import { verifyToken } from "../utils/jwt.js";

let io = null;

export const SOCKET_ROOMS = {
    ADMIN: "admin_room",
    getUserRoom: (userId) => `user_${userId}`,
};

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

/**
 * Initialize Socket.io with the HTTP Server
 * @param {import("http").Server} httpServer 
 */
export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                process.env.FRONTEND_URL,
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173"
            ].filter(Boolean),
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    const parseCookies = cookieParser();
    io.use((socket, next) => {
        parseCookies(socket.request, {}, async (error) => {
            if (error) return next(new Error("Authentication required"));
            try {
                await connectToDB();
                const cookies = socket.request.cookies || {};
                let identity;
                for (const [token, secret] of [
                    [cookies.accessToken, process.env.JWT_ACCESS_SECRET],
                    [cookies.refreshToken, process.env.JWT_REFRESH_SECRET],
                ]) {
                    if (!token) continue;
                    try {
                        identity = verifyToken(token, secret);
                        break;
                    } catch {
                        // A valid refresh cookie may outlive the access cookie.
                    }
                }
                if (!identity?.id || !identity.exp) {
                    return next(new Error("Authentication required"));
                }
                const user = await getLocalUserModel().findById(identity.id);
                if (!user || identity.version !== (user.sessionVersion || 0)) return next(new Error("Authentication required"));
                socket.data.userId = String(user._id);
                socket.data.role = user.role;
                socket.data.expiresAt = identity.exp * 1000;
                next();
            } catch {
                next(new Error("Authentication required"));
            }
        });
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        socket.join(SOCKET_ROOMS.getUserRoom(userId));
        if (socket.data.role === "admin") socket.join(SOCKET_ROOMS.ADMIN);

        const expiryTimer = setTimeout(() => socket.disconnect(true),
            Math.max(0, socket.data.expiresAt - Date.now()));
        expiryTimer.unref?.();
        const respond = (ack, success) => {
            if (typeof ack === "function") ack({ success });
        };
        // Handle joining the admin notification room
        socket.on(SOCKET_EVENTS.JOIN_ADMIN, (ack) => {
            if (socket.data.role !== "admin") return respond(ack, false);
            socket.join(SOCKET_ROOMS.ADMIN);
            respond(ack, true);
        });

        // Handle joining a specific customer/user room
        socket.on(SOCKET_EVENTS.JOIN_USER, (requestedUserId, ack) => {
            if (requestedUserId === userId) {
                socket.join(SOCKET_ROOMS.getUserRoom(userId));
                return respond(ack, true);
            }
            respond(ack, false);
        });

        // Handle leaving a user room (e.g. on logout)
        socket.on(SOCKET_EVENTS.LEAVE_USER, (requestedUserId) => {
            if (requestedUserId === userId) {
                socket.leave(SOCKET_ROOMS.getUserRoom(userId));
            }
        });

        socket.on("disconnect", () => {
            clearTimeout(expiryTimer);
            // Socket automatically leaves rooms upon disconnect
        });
    });

    return io;
};

export const disconnectUserSockets = (userId) => {
    io?.in(SOCKET_ROOMS.getUserRoom(String(userId))).disconnectSockets(true);
};

/**
 * Get current Socket.io instance
 * @returns {import("socket.io").Server}
 */
export const getIO = () => {
    if (!io) {
        console.warn("[Socket.io] Instance requested before initialization.");
    }
    return io;
};

// ==========================================
// Scalable Notification Emitters
// ==========================================

/**
 * Notify all admins of a newly placed order
 * @param {Object} order 
 */
export const emitNewOrder = (order) => {
    if (!io) return;
    io.to(SOCKET_ROOMS.ADMIN).emit(SOCKET_EVENTS.ORDER_NEW, {
        order,
        timestamp: new Date().toISOString(),
        message: `New Order #${order._id.toString().slice(-6).toUpperCase()} received!`,
    });
};

/**
 * Notify admin and customer of an order status change
 * @param {Object} order 
 */
export const emitOrderStatusUpdate = (order) => {
    if (!io) return;
    const payload = {
        order,
        timestamp: new Date().toISOString(),
        message: `Order #${order._id.toString().slice(-6).toUpperCase()} status updated to "${order.status}".`,
    };

    // Broadcast to Admins
    io.to(SOCKET_ROOMS.ADMIN).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);

    // Broadcast to the specific customer
    if (order.userId) {
        const userId = typeof order.userId === "object" ? order.userId._id : order.userId;
        io.to(SOCKET_ROOMS.getUserRoom(userId)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
    }
};

/**
 * Notify all admins of a new prescription upload
 * @param {Object} prescription 
 */
export const emitNewPrescription = (prescription) => {
    if (!io) return;
    io.to(SOCKET_ROOMS.ADMIN).emit(SOCKET_EVENTS.PRESCRIPTION_NEW, {
        prescription,
        timestamp: new Date().toISOString(),
        message: `New Prescription uploaded by ${prescription.name || "Customer"}!`,
    });
};

/**
 * Notify admin and customer of prescription status change
 * @param {Object} prescription 
 */
export const emitPrescriptionStatusUpdate = (prescription) => {
    if (!io) return;
    const payload = {
        prescription,
        timestamp: new Date().toISOString(),
        message: `Prescription status updated to "${prescription.status}".`,
    };

    // Broadcast to Admins
    io.to(SOCKET_ROOMS.ADMIN).emit(SOCKET_EVENTS.PRESCRIPTION_STATUS_UPDATED, payload);

    // Broadcast to specific customer
    if (prescription.userId) {
        const userId = typeof prescription.userId === "object" ? prescription.userId._id : prescription.userId;
        io.to(SOCKET_ROOMS.getUserRoom(userId)).emit(SOCKET_EVENTS.PRESCRIPTION_STATUS_UPDATED, payload);
    }
};
