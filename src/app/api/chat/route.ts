import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cmsBaseUrl =
      process.env.CMS_API_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:7002" : "https://cms.wismannur.pro");

    const body = await req.json();

    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const clientIp =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-vercel-ip") ||
      req.headers.get("x-forwarded-for");
    if (clientIp) {
      forwardHeaders["x-real-ip"] = clientIp;
    }

    const userAgent = req.headers.get("user-agent");
    if (userAgent) {
      forwardHeaders["user-agent"] = userAgent;
    }

    const cmsRes = await fetch(`${cmsBaseUrl.replace(/\/$/, "")}/api/v1/public/chat/visitor`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    return new Response(cmsRes.body, {
      status: cmsRes.status,
      headers: {
        "Content-Type": cmsRes.headers.get("Content-Type") || "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("[Chat Proxy] Error forwarding to CMS:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI assistant service." },
      { status: 502 }
    );
  }
}
