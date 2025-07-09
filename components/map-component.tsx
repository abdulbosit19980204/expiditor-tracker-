"use client"

import { useEffect, useRef, useState } from "react"
import type { Check } from "../lib/types"

interface MapComponentProps {
  checks: Check[]
  selectedCheck: Check | null
  onCheckSelect: (check: Check) => void
  focusLocation?: { lat: number; lng: number } | null
}

declare global {
  interface Window {
    ymaps: any
  }
}

export function MapComponent({ checks, selectedCheck, onCheckSelect, focusLocation }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initMap = async () => {
      try {
        if (!window.ymaps) {
          // Load Yandex Maps API
          const script = document.createElement("script")
          script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=uz_UZ`
          script.async = true
          document.head.appendChild(script)

          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })
        }

        await new Promise((resolve) => {
          window.ymaps.ready(resolve)
        })

        if (mapRef.current && !mapInstanceRef.current) {
          // Initialize map centered on Tashkent
          mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
            center: [41.2995, 69.2401], // Tashkent coordinates
            zoom: 11,
            controls: ["zoomControl", "fullscreenControl", "geolocationControl"],
          })

          // Add map controls
          mapInstanceRef.current.controls.add("routeButtonControl")
          mapInstanceRef.current.controls.add("trafficControl")
          mapInstanceRef.current.controls.add("typeSelector")
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Error initializing map:", err)
        setError("Xaritani yuklashda xatolik yuz berdi")
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !checks.length) return

    // Clear existing placemarks
    mapInstanceRef.current.geoObjects.removeAll()

    // Add placemarks for each check
    checks.forEach((check) => {
      if (check.check_lat && check.check_lon) {
        const placemark = new window.ymaps.Placemark(
          [check.check_lat, check.check_lon],
          {
            balloonContentHeader: `Check: ${check.check_id}`,
            balloonContentBody: `
              <div style="padding: 10px;">
                <p><strong>Expeditor:</strong> ${check.ekispiditor || "Noma'lum"}</p>
                <p><strong>Sana:</strong> ${new Date(check.check_date).toLocaleDateString("uz-UZ")}</p>
                <p><strong>Summa:</strong> ${check.total_sum?.toLocaleString() || "0"} so'm</p>
                <p><strong>Loyiha:</strong> ${check.project || "Noma'lum"}</p>
                <button onclick="window.selectCheck('${check.check_id}')" 
                        style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">
                  Tafsilotlarni ko'rish
                </button>
              </div>
            `,
            balloonContentFooter: `KKM: ${check.kkm_number || "Noma'lum"}`,
          },
          {
            preset: selectedCheck?.check_id === check.check_id ? "islands#redDotIcon" : "islands#blueDotIcon",
            iconColor: selectedCheck?.check_id === check.check_id ? "#ff0000" : "#0095b6",
          },
        )

        placemark.events.add("click", () => {
          onCheckSelect(check)
        })

        mapInstanceRef.current.geoObjects.add(placemark)
      }
    })

    // Fit bounds to show all placemarks
    if (checks.length > 0) {
      const bounds = []
      checks.forEach((check) => {
        if (check.check_lat && check.check_lon) {
          bounds.push([check.check_lat, check.check_lon])
        }
      })

      if (bounds.length > 0) {
        mapInstanceRef.current.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 50,
        })
      }
    }

    // Global function for balloon button clicks
    window.selectCheck = (checkId: string) => {
      const check = checks.find((c) => c.check_id === checkId)
      if (check) {
        onCheckSelect(check)
      }
    }
  }, [checks, selectedCheck, onCheckSelect])

  useEffect(() => {
    if (focusLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([focusLocation.lat, focusLocation.lng], 16)

      // Add temporary marker for focused location
      const focusPlacemark = new window.ymaps.Placemark(
        [focusLocation.lat, focusLocation.lng],
        {
          balloonContent: "Tanlangan lokatsiya",
        },
        {
          preset: "islands#redDotIcon",
          iconColor: "#ff0000",
        },
      )

      mapInstanceRef.current.geoObjects.add(focusPlacemark)

      // Remove focus marker after 3 seconds
      setTimeout(() => {
        mapInstanceRef.current.geoObjects.remove(focusPlacemark)
      }, 3000)
    }
  }, [focusLocation])

  if (error) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Qayta yuklash
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Xarita yuklanmoqda...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
        <h4 className="font-semibold text-sm mb-2">Belgilar:</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Oddiy check</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Tanlangan check</span>
          </div>
        </div>
      </div>
    </div>
  )
}
