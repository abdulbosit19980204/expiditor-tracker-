"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Navigation, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Check, Expeditor } from "@/lib/types"

interface MapComponentProps {
  checks: Check[]
  selectedExpeditor: Expeditor | null
  loading: boolean
  onCheckClick?: (check: Check) => void
  focusLocation?: { lat: number; lng: number } | null
}

export function MapComponent({ checks, selectedExpeditor, loading, onCheckClick, focusLocation }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Initialize Yandex Map
  useEffect(() => {
    const initMap = async () => {
      try {
        // Load Yandex Maps API script
        if (!window.ymaps) {
          const script = document.createElement("script")
          script.src = "https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=en_US"
          script.async = true
          document.head.appendChild(script)

          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })
        }

        // Initialize map
        await window.ymaps.ready()

        if (mapRef.current && !mapInstance) {
          const map = new window.ymaps.Map(mapRef.current, {
            center: [41.2995, 69.2401], // Tashkent center
            zoom: 11,
            controls: ["zoomControl", "fullscreenControl", "typeSelector"],
          })

          setMapInstance(map)
          setIsMapLoaded(true)
        }
      } catch (error) {
        console.error("Failed to load Yandex Maps:", error)
        setMapError("Failed to load map")
      }
    }

    initMap()
  }, [mapInstance])

  // Add markers when checks change
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || !checks.length) return

    // Clear existing markers
    mapInstance.geoObjects.removeAll()

    // Add markers for each check
    checks.forEach((check) => {
      if (check.check_lat && check.check_lon) {
        const placemark = new window.ymaps.Placemark(
          [check.check_lat, check.check_lon],
          {
            balloonContentHeader: check.check_id,
            balloonContentBody: `
              <div>
                <p><strong>Expeditor:</strong> ${check.ekispiditor}</p>
                <p><strong>Project:</strong> ${check.project}</p>
                <p><strong>Total:</strong> ${check.total_sum?.toLocaleString()} UZS</p>
                <p><strong>Date:</strong> ${new Date(check.check_date).toLocaleDateString()}</p>
              </div>
            `,
            balloonContentFooter: `KKM: ${check.kkm_number}`,
          },
          {
            preset: "islands#greenDotIcon",
            iconColor: check.total_sum && check.total_sum > 0 ? "#4ade80" : "#ef4444",
          },
        )

        // Add click handler
        placemark.events.add("click", () => {
          if (onCheckClick) {
            onCheckClick(check)
          }
        })

        mapInstance.geoObjects.add(placemark)
      }
    })

    // Fit bounds to show all markers
    if (checks.length > 0) {
      const bounds = mapInstance.geoObjects.getBounds()
      if (bounds) {
        mapInstance.setBounds(bounds, { checkZoomRange: true })
      }
    }
  }, [mapInstance, isMapLoaded, checks, onCheckClick])

  // Focus on specific location
  useEffect(() => {
    if (mapInstance && focusLocation) {
      mapInstance.setCenter([focusLocation.lat, focusLocation.lng], 15)
    }
  }, [mapInstance, focusLocation])

  if (mapError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Error</h3>
            <p className="text-gray-600">{mapError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {(loading || !isMapLoaded) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-gray-600">{loading ? "Loading checks..." : "Loading map..."}</p>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <h4 className="font-semibold text-sm">Legend</h4>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs">Successful Check</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs">Failed Check</span>
        </div>
      </div>

      {/* Selected Expeditor Info */}
      {selectedExpeditor && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-64">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Navigation className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold">{selectedExpeditor.name}</h4>
              <p className="text-sm text-gray-600">{selectedExpeditor.transport_number}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{checks.length} checks</span>
            </div>
            <Badge variant="outline">
              {checks.reduce((sum, check) => sum + (check.total_sum || 0), 0).toLocaleString()} UZS
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
