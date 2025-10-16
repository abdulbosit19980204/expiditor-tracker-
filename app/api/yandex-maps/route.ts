import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get("lang") || "en_US"
  const version = searchParams.get("v") || "2.1"

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || process.env.YANDEX_MAPS_API_KEY || ""

  try {
    if (!apiKey) {
      // Return a JavaScript stub that logs the missing key
      return new NextResponse(`console.warn("[Yandex Maps] API key not configured, map features may be limited");`, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache",
        },
      })
    }

    // Fetch the actual Yandex Maps script
    const yandexUrl = `https://api-maps.yandex.ru/${version}/?apikey=${apiKey}&lang=${lang}`
    
    const response = await fetch(yandexUrl)

    if (!response.ok) {
      throw new Error(`Yandex API returned ${response.status}`)
    }

    const scriptContent = await response.text()

    // Check if response is HTML (error page)
    if (scriptContent.trim().startsWith("<")) {
      throw new Error("Yandex returned HTML instead of JavaScript")
    }

    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("[Yandex Maps Proxy]", error)

    // Always return valid JavaScript, never HTML
    return new NextResponse(`console.error("[Yandex Maps] Proxy failed: ${error}");`, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    })
  }
}
