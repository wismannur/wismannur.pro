import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

// Server-side auth guard (Next 16 proxy — the middleware.ts successor).
// Replaces the client-only <ProtectedRoute> flash for /cms/*: unauthenticated
// requests never reach the CMS pages at all. Verifies the Auth.js JWT cookie
// directly via next-auth/jwt — src/auth.ts must NOT be imported here (it pulls
// bcrypt + the db driver into the edge bundle).

export default async function proxy(request: NextRequest) {
  // 1. Local environment mismatch guard (Defense-in-depth against accidental cross-environment tunnel traffic)
  if (process.env.NODE_ENV === "development") {
    const host = request.headers.get("host") || "";
    const dbEnv = process.env.DB_ENV || process.env.NEXT_PUBLIC_DB_ENV;

    if (dbEnv === "prod" && host.includes("local-dev.wismannur.pro")) {
      return new NextResponse(
        "⛔ Environment Mismatch: Server is running in PRODUCTION mode (port 7001), but accessed via local-dev.wismannur.pro.\nCheck Cloudflare Tunnel routing (local-prod -> 7001, local-dev -> 7000).",
        {
          status: 403,
          headers: { "content-type": "text/plain; charset=utf-8" },
        }
      );
    }

    if (dbEnv === "dev" && host.includes("local-prod.wismannur.pro")) {
      return new NextResponse(
        "⛔ Environment Mismatch: Server is running in DEV mode (port 7000), but accessed via local-prod.wismannur.pro.\nCheck Cloudflare Tunnel routing (local-prod -> 7001, local-dev -> 7000).",
        {
          status: 403,
          headers: { "content-type": "text/plain; charset=utf-8" },
        }
      );
    }
  }

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/cms") || pathname === "/login";

  // Fast-path for non-protected routes (avoids unnecessary token decryption)
  if (!isAuthRoute) {
    return NextResponse.next();
  }

  // 2. Server-side auth guard for /cms and /login
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

  if (pathname.startsWith("/cms") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/cms/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
