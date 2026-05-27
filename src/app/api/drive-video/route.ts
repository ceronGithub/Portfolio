export const dynamic = 'force-dynamic';
// api/drive-video/route.ts
// Proxies Google Drive video files to the browser with proper streaming headers.
// Usage: /api/drive-video?id=DRIVE_FILE_ID
//
// Why needed: drive.google.com/uc?export=download redirects through a
// confirmation page for files >100MB — browsers can't follow these redirects
// for <video src>. This proxy follows the redirect server-side and streams
// the actual bytes back with Range support for video seeking.

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  // First hit the export URL — Google will redirect to either:
  // (a) the actual file CDN URL, or
  // (b) a virus-scan warning page (for large files — handled below)
  const exportUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;

  const range = req.headers.get("range") ?? undefined;

  const fetchHeaders: Record<string, string> = {
    "User-Agent": "Mozilla/5.0",
  };
  if (range) fetchHeaders["Range"] = range;

  try {
    const upstream = await fetch(exportUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse(`Drive error: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType   = upstream.headers.get("content-type")   ?? "video/mp4";
    const contentLength = upstream.headers.get("content-length");
    const contentRange  = upstream.headers.get("content-range");
    const acceptRanges  = upstream.headers.get("accept-ranges")  ?? "bytes";

    const resHeaders: Record<string, string> = {
      "Content-Type":  contentType,
      "Accept-Ranges": acceptRanges,
      "Cache-Control": "public, max-age=3600",
    };
    if (contentLength) resHeaders["Content-Length"] = contentLength;
    if (contentRange)  resHeaders["Content-Range"]  = contentRange;

    return new NextResponse(upstream.body, {
      status:  upstream.status,
      headers: resHeaders,
    });

  } catch (err) {
    console.error("[drive-video] proxy error:", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}