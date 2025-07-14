import { NextResponse, type NextRequest } from "next/server"

/**
 * Edge-compatible Route that proxies the Yandex Maps script
 * so the API key is **never** exposed on the client.
 * Always returns valid JavaScript – never HTML – so the client
 * won’t throw “Unexpected token '<'”.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get("lang") ?? "en_US"
  const version = searchParams.get("v") ?? "2.1"

  // Prefer secure key if present, otherwise fall back to
  // Yandex’s public “demo” key (limited quota).
  const apiKey = process.env.YANDEX_MAPS_API_KEY || "0d3f3e04-6d70-41e3-8ad4-5b3e3e075a23"

  // Build the remote script URL
  const remoteUrl = `https://api-maps.yandex.ru/${version}/?apikey=${apiKey}&lang=${lang}`

  try {
    const r = await fetch(remoteUrl, { next: { revalidate: 60 * 60 } }) // 1-hour cache

    const contentType = r.headers.get("content-type") ?? ""

    // ───────────────────────────────────────────────────────────
    // SAFETY-CHECK:
    // If Yandex returns HTML (starts with '<') or the status isn’t 2xx,
    // send a tiny *valid* JS stub instead of forwarding the HTML page.
    // ───────────────────────────────────────────────────────────
    if (!r.ok || !contentType.includes("javascript")) {
      const msg = `Failed to load Yandex Maps (${r.status})`
      const stub = `console.error("${msg}");` // still valid JS, avoids < token error
      return new NextResponse(stub, {
        status: 200,
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      })
    }

    const script = await r.text()

    return new NextResponse(script, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    })
  } catch (err) {
    console.error("[Yandex Proxy] error:", err)
    const stub = `console.error("Yandex Maps proxy failed");`
    return new NextResponse(stub, {
      status: 200,
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    })
  }
}
