import { NextResponse } from "next/server"

export async function GET() {
  // This endpoint serves the Yandex Maps script with API key
  // The API key is kept server-side only
  const apiKey = process.env.YANDEX_MAPS_API_KEY || "demo-key"

  const scriptContent = `
    // Yandex Maps API loader
    (function() {
      if (window.ymaps) return;
      
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=en_US';
      script.async = true;
      document.head.appendChild(script);
    })();
  `

  return new NextResponse(scriptContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
