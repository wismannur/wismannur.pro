import { NextRequest, NextResponse } from "next/server";
import { getBlobStoreHost } from "@/lib/attachment-url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse("File path missing", { status: 404 });
  }

  const rawSubPath = path.join("/");
  const host = getBlobStoreHost();
  const blobUrl = `https://${host}/${rawSubPath}`;

  try {
    const blobRes = await fetch(blobUrl);
    if (!blobRes.ok) {
      return new NextResponse("Attachment Not Found", { status: blobRes.status });
    }

    const contentType = blobRes.headers.get("content-type") || "application/octet-stream";
    const filename = path[path.length - 1] || "attachment";

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Content-Disposition", `inline; filename="${filename}"`);
    responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    const contentLength = blobRes.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new NextResponse(blobRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[Attachments Route] Error streaming attachment:", err);
    return new NextResponse("Failed to load attachment", { status: 500 });
  }
}
