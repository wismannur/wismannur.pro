import { NextResponse, type NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect legacy /cms and /login routes to dedicated cms.wismannur.pro
  if (pathname.startsWith("/cms") || pathname === "/login") {
    const cmsUrl =
      process.env.CMS_PUBLIC_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:7002" : "https://cms.wismannur.pro");
    return NextResponse.redirect(new URL(pathname, cmsUrl), 308);
  }

  return NextResponse.next();
}
