"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Check, Expeditor } from "@/lib/types"

interface MapComponentProps {
  checks: Check[]
  selectedExpeditor: Expeditor | null
  loading: boolean
  onCheckClick: (check: Check) => void
  focusLocation?: { lat: number; lng: number } | null
}

export function MapComponent({ checks, selectedExpeditor, loading, onCheckClick, focusLocation }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const markersRef = useRef<any[]>([])

  // Load Yandex Maps script
  useEffect(() => {
    const loadYandexMaps = async () => {
      try {
        // Check if already loaded
        if (window.ymaps) {
          initializeMap()
          return
        }

        // Try to load from our proxy first
        const proxyResponse = await fetch("/api/yandex-maps")
        const proxyText = await proxyResponse.text()

        // Check if response is HTML (error page)
        if (proxyText.trim().startsWith("<")) {
          throw new Error("Proxy returned HTML instead of JavaScript")
        }

        // Execute the script
        const script = document.createElement("script")
        script.textContent = proxyText
        document.head.appendChild(script)

        // Wait for ymaps to be available
        let attempts = 0
        const checkYmaps = () => {
          if (window.ymaps) {
            initializeMap()
          } else if (attempts < 50) {
            attempts++
            setTimeout(checkYmaps, 100)
          } else {
            throw new Error("Yandex Maps failed to load after 5 seconds")
          }
        }
        checkYmaps()
      } catch (error) {
        console.warn("Proxy failed, trying fallback:", error)

        // Fallback to direct Yandex CDN with demo key
        const fallbackScript = document.createElement("script")
        fallbackScript.src = "https://api-maps.yandex.ru/2.1/?apikey=your-demo-key&lang=en_US"
        fallbackScript.onload = () => {
          if (window.ymaps) {
            initializeMap()
          } else {
            setMapError("Failed to load Yandex Maps")
          }
        }
        fallbackScript.onerror = () => {
          setMapError("Failed to load Yandex Maps")
        }
        document.head.appendChild(fallbackScript)
      }
    }

    const initializeMap = () => {
      if (!window.ymaps || !mapRef.current) return

      window.ymaps.ready(() => {
        try {
          const map = new window.ymaps.Map(mapRef.current, {
            center: [41.2995, 69.2401], // Tashkent coordinates
            zoom: 10,
            controls: ["zoomControl", "fullscreenControl"],
          })

          setMapInstance(map)
          setIsMapLoaded(true)
          setMapError(null)
        } catch (error) {
          console.error("Map initialization error:", error)
          setMapError("Failed to initialize map")
        }
      })
    }

    loadYandexMaps()
  }, [])

  // Update markers when checks change
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstance.geoObjects.remove(marker)
    })
    markersRef.current = []

    // Add new markers
    checks.forEach((check) => {
      if (check.check_lat && check.check_lon) {
        try {
          const placemark = new window.ymaps.Placemark(
            [check.check_lat, check.check_lon],
            {
              balloonContentHeader: check.check_id,
              balloonContentBody: `
                <div>
                  <p><strong>Project:</strong> ${check.project || "N/A"}</p>
                  <p><strong>City:</strong> ${check.city || "N/A"}</p>
                  <p><strong>Expeditor:</strong> ${check.ekispiditor || "N/A"}</p>
                  <p><strong>Amount:</strong> ${(check.total_sum || 0).toLocaleString()} UZS</p>
                  <p><strong>Date:</strong> ${new Date(check.check_date).toLocaleDateString()}</p>
                </div>
              `,
            },
            {
              preset: "islands#redDotIcon",
              iconColor: selectedExpeditor && check.ekispiditor === selectedExpeditor.name ? "#ff0000" : "#0066cc",
            },
          )

          placemark.events.add("click", () => {
            onCheckClick(check)
          })

          mapInstance.geoObjects.add(placemark)
          markersRef.current.push(placemark)
        } catch (error) {
          console.error("Error adding marker:", error)
        }
      }
    })
  }, [checks, mapInstance, isMapLoaded, selectedExpeditor, onCheckClick])

  // Focus on specific location
  useEffect(() => {
    if (!mapInstance || !focusLocation) return

    try {
      mapInstance.setCenter([focusLocation.lat, focusLocation.lng], 15, {
        duration: 1000,
      })
    } catch (error) {
      console.error("Error focusing on location:", error)
    }
  }, [focusLocation, mapInstance])

  if (mapError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
            <p className="text-gray-600 mb-4">{mapError}</p>
            <div className="space-y-2">
              <Badge variant="outline" className="block">
                <MapPin className="h-3 w-3 mr-1" />
                {checks.length} checks available
              </Badge>
              {selectedExpeditor && (
                <Badge variant="secondary" className="block">
                  Expeditor: {selectedExpeditor.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      {!isMapLoaded && !loading && !mapError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Initializing map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
