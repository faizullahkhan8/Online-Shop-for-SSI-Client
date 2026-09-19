import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:5174",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:5174",
                ws: true,
                changeOrigin: true,
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    "vendor-react": ["react", "react-dom", "react-router-dom"],
                    "vendor-state": ["@reduxjs/toolkit", "react-redux", "redux-persist"],
                    "vendor-data": ["@tanstack/react-query", "axios"],
                }
            }
        }
    }
});
