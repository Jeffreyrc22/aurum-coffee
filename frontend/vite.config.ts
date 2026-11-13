import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion") || id.includes("/motion-"))
            return "motion";
          if (id.includes("@tanstack")) return "query";
          if (
            id.includes("zod") ||
            id.includes("react-hook-form") ||
            id.includes("@hookform")
          )
            return "forms";
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api": { target: "http://127.0.0.1:8080", changeOrigin: true },
      "/swagger-ui": { target: "http://127.0.0.1:8080" },
      "/v3/api-docs": { target: "http://127.0.0.1:8080" },
    },
  },
});
