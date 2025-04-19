import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd());

	return {
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
	};
});
