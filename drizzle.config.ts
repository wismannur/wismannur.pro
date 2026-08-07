import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js loads .env.local itself; the drizzle-kit CLI does not.
config({ path: ".env.local" });

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		// Required for migrate/push/studio; `generate` works offline without it.
		url: process.env.DATABASE_URL ?? "",
	},
});
