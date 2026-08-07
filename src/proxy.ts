import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

// Server-side auth guard (Next 16 proxy — the middleware.ts successor).
// Replaces the client-only <ProtectedRoute> flash for /cms/*: unauthenticated
// requests never reach the CMS pages at all. Verifies the Auth.js JWT cookie
// directly via next-auth/jwt — src/auth.ts must NOT be imported here (it pulls
// bcrypt + the db driver into the edge bundle).

export default async function proxy(request: NextRequest) {
	// Over HTTPS Auth.js writes the session as `__Secure-authjs.session-token`,
	// but getToken() defaults `secureCookie` to false — it would look for the
	// unprefixed dev name (and derive the decryption salt from it), so on
	// production every /cms request looked signed-out. Detect the scheme and
	// let getToken pick the matching cookie name + salt.
	const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
	const secureCookie = forwardedProto
		? forwardedProto === "https"
		: request.nextUrl.protocol === "https:";
	const token = await getToken({
		req: request,
		secret: process.env.AUTH_SECRET,
		secureCookie,
	});
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/cms") && !token) {
		return NextResponse.redirect(new URL("/login", request.url));
	}
	if (pathname === "/login" && token) {
		return NextResponse.redirect(new URL("/cms/dashboard", request.url));
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/cms/:path*", "/login"],
};
