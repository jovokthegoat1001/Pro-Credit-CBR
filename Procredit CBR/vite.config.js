import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".",
  publicDir: "public",
  server: {
    port: 3007,
    proxy: {
      "/api/extract-cic": {
        target: "http://localhost:3009",
        changeOrigin: true,
      },
      "/api/extract-text": {
        target: "http://localhost:3009",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3008",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3007,
    proxy: {
      "/api/extract-cic": {
        target: "http://localhost:3009",
        changeOrigin: true,
      },
      "/api/extract-text": {
        target: "http://localhost:3009",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3008",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["pdfjs-dist"],
  },
});
