import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.YANDEX_MAPS_API_KEY

  if (!apiKey) {
    // Return a minimal JavaScript stub instead of throwing an error
    return new NextResponse(`console.warn("Yandex Maps API key not configured");`, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    })
  }

  try {
    const yandexUrl = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=en_US`
    const response = await fetch(yandexUrl)

    if (!response.ok) {
      throw new Error(`Yandex API responded with ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || ""
    const scriptContent = await response.text()

    // Check if Yandex returned HTML (error page) instead of JavaScript
    if (contentType.includes("text/html") || scriptContent.trim().startsWith("<")) {
      throw new Error("Yandex returned HTML instead of JavaScript")
    }

    return new NextResponse(scriptContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("Yandex Maps proxy error:", error)

    // Always return valid JavaScript, never HTML
    return new NextResponse(`console.error("Yandex Maps proxy failed: ${error}");`, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    })
  }
}
