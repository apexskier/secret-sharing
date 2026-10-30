import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 1249,
  },
  build: {
    // Mirrors the path it's served at, so assets resolve without rewriting.
    outDir: "dist/secret-sharing",
    sourcemap: true,
  },
  base: "./",
  plugins: [react()],
});
