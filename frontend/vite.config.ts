import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Only watch specific directories
      include: ['src/**/*.{js,jsx,ts,tsx,css}'],
      // Ignore certain directories
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/public/**'
      ],
      // Add delay to prevent rapid reloads
      usePolling: true,
      interval: 2000
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
