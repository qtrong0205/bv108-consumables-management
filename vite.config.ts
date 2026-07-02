import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    publicDir: "./public",
    base: "/",
    css: {
        postcss: {
            plugins: [tailwind()],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select', '@radix-ui/react-checkbox'],
                    charts: ['recharts'],
                },
            },
        },
    },
});
