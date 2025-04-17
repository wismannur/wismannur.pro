import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), componentTagger()],
  server: {
    port: 8080,
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@mdx-js/*", "rehype-*", "remark-*"],
  },
  build: {
    target: "es2020",
    rollupOptions: {
      external: ["esbuild"],
    },
  },
}));
