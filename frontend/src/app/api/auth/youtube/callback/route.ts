import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function GET(req: NextRequest) {
  if (!API_BASE) {
    return NextResponse.json(
      { detail: "Backend URL is not configured" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const search = url.search; // includes leading ? if present

  const targetUrl = `${API_BASE}/youtube/auth/callback${search}`;

  try {
    const backendResponse = await fetch(targetUrl, {
      // We want to see redirects so we can forward them
      redirect: "manual",
    });

    // If backend responds with a redirect, forward it to the browser
    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      const location = backendResponse.headers.get("location");
      if (location) {
        return NextResponse.redirect(location);
      }
    }

    // Otherwise, proxy through the body/status (in case of error messages)
    const text = await backendResponse.text();
    return new NextResponse(text, {
      status: backendResponse.status,
      headers: {
        "content-type": backendResponse.headers.get("content-type") || "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Error proxying YouTube callback to backend", err);
    return NextResponse.json(
      { detail: "Failed to reach backend YouTube callback" },
      { status: 502 }
    );
  }
}
