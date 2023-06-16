import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 1249,
  },
  build: {
    sourcemap: true,
  },
  base: "./",
  plugins: [react()],
});
