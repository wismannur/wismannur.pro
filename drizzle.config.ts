import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js loads .env files itself; the drizzle-kit CLI does not.
if (process.env.DB_ENV === "prod" || process.env.DB_ENV === "production") {
	config({ path: ".env.production.local" });
	config({ path: ".env.production" });
} else {
	config({ path: ".env.development.local" });
	config({ path: ".env.development" });
}
config({ path: ".env.local" });
config({ path: ".env" });

const isProd =
	process.env.DB_ENV === "prod" || process.env.DB_ENV === "production";

const dbUrl =
	(isProd
		? (process.env.DATABASE_URL_PROD ??
			process.env.PROD_DATABASE_URL ??
			process.env.DATABASE_URL)
		: (process.env.DATABASE_URL_DEV ??
			process.env.DEV_DATABASE_URL ??
			process.env.DATABASE_URL)) ?? "";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		// Required for migrate/push/studio; `generate` works offline without it.
		url: dbUrl,
	},
});
