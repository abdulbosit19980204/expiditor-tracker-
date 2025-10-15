import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get("lang") || "en_US"
  const version = searchParams.get("v") || "2.1"

  // Get API key from environment or use fallback
  const apiKey = process.env.YANDEX_MAPS_API_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || "60bf1ed7-7273-4bf6-af8a-bb77a1f0c129"

  console.log("[Yandex Maps Proxy] Request params:", { lang, version })
  console.log("[Yandex Maps Proxy] Using API key:", apiKey ? `${apiKey.substring(0, 8)}...` : "none")
  
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    console.log("[Yandex Maps Proxy] Development mode detected")
  }
  const fallbackScript = `
console.log("[Yandex Maps] Using fallback implementation to prevent errors");

// Override Array.prototype.forEach to prevent errors
const originalForEach = Array.prototype.forEach;
Array.prototype.forEach = function(callback, thisArg) {
  if (this == null) {
    throw new TypeError('Array.prototype.forEach called on null or undefined');
  }
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }
  return originalForEach.call(this, callback, thisArg);
};

// Provide a working ymaps implementation
window.ymaps = window.ymaps || {
  ready: function(callback) {
    console.log("[Yandex Maps] Ready callback executed");
    if (callback) {
      setTimeout(callback, 100); // Small delay to simulate loading
    }
  },
  Map: function(container, options) {
    console.log("[Yandex Maps] Creating map with fallback implementation");
    return {
      geoObjects: {
        add: function(obj) {
          console.log("[Yandex Maps] Adding geo object:", obj);
        },
        removeAll: function() {
          console.log("[Yandex Maps] Removing all geo objects");
        },
        getBounds: function() {
          console.log("[Yandex Maps] Getting bounds");
          return null;
        }
      },
      setCenter: function(center, zoom) {
        console.log("[Yandex Maps] Setting center:", center, "zoom:", zoom);
      },
      setBounds: function(bounds, options) {
        console.log("[Yandex Maps] Setting bounds:", bounds, "options:", options);
      },
      destroy: function() {
        console.log("[Yandex Maps] Destroying map");
      }
    };
  },
  Placemark: function(coords, properties, options) {
    console.log("[Yandex Maps] Creating placemark:", coords);
    return {
      events: {
        add: function(event, handler) {
          console.log("[Yandex Maps] Adding event:", event);
        }
      }
    };
  },
  Polyline: function(coords, properties, options) {
    console.log("[Yandex Maps] Creating polyline:", coords);
    return {};
  }
};

// Mark as loaded
window.ymaps._loaded = true;
`

  try {
    // Check if API key is available
    if (!apiKey || apiKey === "your-api-key-here") {
      console.warn("[Yandex Maps Proxy] No valid API key found, using fallback")
      return new NextResponse(fallbackScript, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache",
        },
      })
    }

    // Try to load the real Yandex Maps API
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

    if (scriptContent.trim().startsWith("<")) {
      console.error("[Yandex Maps Proxy] Received HTML instead of JavaScript")
      throw new Error("Yandex returned HTML instead of JavaScript")
    }

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
    return new NextResponse(fallbackScript, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    })
  }
}
