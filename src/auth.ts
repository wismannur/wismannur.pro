import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

import { getDb, schema } from "@/db";

// Auth.js v5 — single-admin credentials auth (phase 8.4).
// Identity lives in env vars (ADMIN_EMAIL + bcrypt ADMIN_PASSWORD_HASH); the
// public profile (uid/displayName/photoURL) is read from the seeded `users`
// row so the session matches the content's authorId ("mock-admin").
// This module is server-only by construction (bcrypt + db) — the middleware
// (src/proxy.ts) deliberately avoids importing it and verifies the JWT with
// `next-auth/jwt` instead.

export const { handlers, auth, signIn, signOut } = NextAuth({
	session: { strategy: "jwt" },
	pages: { signIn: "/login" },
	trustHost: true,
	providers: [
		Credentials({
			credentials: { email: {}, password: {} },
			authorize: async (credentials) => {
				const email = String(credentials?.email ?? "")
					.trim()
					.toLowerCase();
				const password = String(credentials?.password ?? "");
				const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
				// base64-encoded because bcrypt hashes contain `$`, which Next's
				// .env loader (dotenv-expand) mangles via variable expansion.
				const passwordHash = Buffer.from(
					process.env.ADMIN_PASSWORD_HASH_B64 ?? "",
					"base64",
				).toString("utf8");
				if (!adminEmail || !passwordHash) {
					console.error("Auth is not configured: set ADMIN_EMAIL and ADMIN_PASSWORD_HASH_B64");
					return null;
				}
				if (email !== adminEmail) return null;
				const ok = await bcrypt.compare(password, passwordHash);
				if (!ok) return null;

				const [profile] = await getDb()
					.select()
					.from(schema.users)
					.where(eq(schema.users.email, adminEmail))
					.limit(1);
				return {
					id: profile?.uid ?? "admin",
					email: adminEmail,
					name: profile?.displayName ?? "Admin",
					image: profile?.photoURL ?? null,
				};
			},
		}),
	],
	callbacks: {
		jwt({ token, user }) {
			if (user) token.uid = (user as { id?: string }).id;
			return token;
		},
		session({ session, token }) {
			(session.user as { uid?: string }).uid = token.uid as string | undefined;
			return session;
		},
	},
});
