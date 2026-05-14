import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        global: "globalThis",
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": "/src",
        },
    },
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
            },
            // Proxy WebSocket SockJS endpoint
            "/ws": {
                target: "http://localhost:8080",
                changeOrigin: true,
                ws: true,
            },
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            target: "esnext",
        },
    },
    esbuild: {
        target: "esnext",
    },
});

