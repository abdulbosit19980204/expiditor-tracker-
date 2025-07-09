"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { VisitedLocation, Expeditor, Check } from "../lib/types"

interface MapComponentProps {
  locations: VisitedLocation[]
  loading: boolean
  selectedExpeditor: Expeditor | null
  onLocationClick?: (check: Check) => void
}

export function MapComponent({ locations, loading, selectedExpeditor, onLocationClick }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])

  // Initialize Yandex Map
  useEffect(() => {
    if (!mapRef.current) return

    const initMap = () => {
      if (typeof window !== "undefined" && window.ymaps) {
        window.ymaps.ready(() => {
          const map = new window.ymaps.Map(mapRef.current, {
            center: [41.2995, 69.2401], // Tashkent coordinates
            zoom: 11,
            controls: ["zoomControl", "fullscreenControl"],
          })

          setMapInstance(map)
        })
      }
    }

    // Load Yandex Maps API if not already loaded
    if (!window.ymaps) {
      const script = document.createElement("script")
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=en_US`
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [])

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstance || !locations.length) return

    // Clear existing markers
    markers.forEach((marker) => {
      mapInstance.geoObjects.remove(marker)
    })

    const newMarkers: any[] = []

    locations.forEach((location) => {
      const placemark = new window.ymaps.Placemark(
        [location.coordinates.lat, location.coordinates.lng],
        {
          balloonContentHeader: location.clientName,
          balloonContentBody: `
            <div>
              <p><strong>Address:</strong> ${location.address}</p>
              <p><strong>Visit Time:</strong> ${location.visitTime}</p>
              <p><strong>Status:</strong> ${location.status}</p>
              ${
                location.check.check_detail
                  ? `
                <p><strong>Check ID:</strong> ${location.check.check_id}</p>
                <p><strong>Total:</strong> ${location.check.check_detail.total_sum || 0} UZS</p>
              `
                  : ""
              }
            </div>
          `,
          balloonContentFooter: location.notes || "",
        },
        {
          preset: location.status === "delivered" ? "islands#greenDotIcon" : "islands#redDotIcon",
          iconColor: location.status === "delivered" ? "#00AA00" : "#FF0000",
        },
      )

      // Add click handler
      placemark.events.add("click", () => {
        if (onLocationClick && location.check) {
          onLocationClick(location.check)
        }
      })

      mapInstance.geoObjects.add(placemark)
      newMarkers.push(placemark)
    })

    setMarkers(newMarkers)

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      mapInstance.setBounds(mapInstance.geoObjects.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 50,
      })
    }
  }, [mapInstance, locations, onLocationClick])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading locations...</p>
        </div>
      </div>
    )
  }

  if (!selectedExpeditor) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Expeditor</h3>
          <p className="text-gray-600">Choose an expeditor from the list to view their locations on the map</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Info Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">{selectedExpeditor.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Delivered: {locations.filter((l) => l.status === "delivered").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Failed: {locations.filter((l) => l.status === "failed").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="text-xs font-medium mb-2">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Successful Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Failed Delivery</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Locations Badge */}
      {locations.length > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm">
            {locations.length} locations
          </Badge>
        </div>
      )}
    </div>
  )
}
