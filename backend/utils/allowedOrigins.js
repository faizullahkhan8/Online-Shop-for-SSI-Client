// Keep HTTP mutations, CORS and Socket.IO on the same trusted-origin list.
export const allowedOrigins = () => [
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV === "production" ? [] : [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:3000", "http://192.168.110.11:5173",
    ]),
].filter(Boolean);
