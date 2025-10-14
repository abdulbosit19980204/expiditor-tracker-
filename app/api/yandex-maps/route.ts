import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get("lang") || "en_US"
  const version = searchParams.get("v") || "2.1"

  // const apiKey = process.env.YANDEX_MAPS_API_KEY ||"5080fe14-e264-4e2a-9e31-164d4b96da6e"
  const apiKey = process.env.YANDEX_MAPS_API_KEY ||"60bf1ed7-7273-4bf6-af8a-bb77a1f0c129"

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
    
    console.log("[Yandex Maps Proxy] Fetching from:", yandexUrl)
    
    const response = await fetch(yandexUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      console.error("[Yandex Maps Proxy] API returned status:", response.status)
      throw new Error(`Yandex API returned ${response.status}: ${response.statusText}`)
    }

    const scriptContent = await response.text()

    // Check if response is HTML (error page)
    if (scriptContent.trim().startsWith("<")) {
      console.error("[Yandex Maps Proxy] Received HTML instead of JavaScript")
      throw new Error("Yandex returned HTML instead of JavaScript")
    }

    // Check if the script content looks valid
    if (!scriptContent.includes('ymaps') && !scriptContent.includes('window.ymaps')) {
      console.warn("[Yandex Maps Proxy] Script content doesn't look like Yandex Maps")
    }

    console.log("[Yandex Maps Proxy] Successfully loaded Yandex Maps script")

    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("[Yandex Maps Proxy] Error:", error)

    // Return a stub that provides basic ymaps object to prevent errors
    const stubScript = `
console.error("[Yandex Maps] Proxy failed:", "${error}");
// Provide a minimal stub to prevent errors
window.ymaps = window.ymaps || {
  ready: function(callback) {
    console.warn("[Yandex Maps] Using stub implementation");
    if (callback) callback();
  },
  Map: function() {
    console.warn("[Yandex Maps] Using stub Map implementation");
    return {
      geoObjects: { add: function() {}, removeAll: function() {}, getBounds: function() { return null; } },
      setCenter: function() {},
      setBounds: function() {},
      destroy: function() {}
    };
  },
  Placemark: function() {
    console.warn("[Yandex Maps] Using stub Placemark implementation");
    return { events: { add: function() {} } };
  },
  Polyline: function() {
    console.warn("[Yandex Maps] Using stub Polyline implementation");
    return {};
  }
};
`

    return new NextResponse(stubScript, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    })
  }
}
