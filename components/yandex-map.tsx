"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Clock, Plus, Minus, Layers, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "./loading-spinner"
import type { VisitedLocation, Expeditor } from "../lib/types"

interface YandexMapProps {
  locations: VisitedLocation[]
  loading: boolean
  selectedExpeditor: Expeditor | null
}

// Yandex Maps integration types
declare global {
  interface Window {
    ymaps: any
  }
}

export function YandexMap({ locations, loading, selectedExpeditor }: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<VisitedLocation | null>(null)
  const [zoomLevel, setZoomLevel] = useState(12)
  const markersRef = useRef<any[]>([])

  // Initialize Yandex Map
  useEffect(() => {
    const initYandexMap = async () => {
      try {
        // In real implementation, load Yandex Maps API
        // const script = document.createElement('script')
        // script.src = 'https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=ru_RU'
        // document.head.appendChild(script)

        // Simulate API loading
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Simulate ymaps.ready callback
        if (mapRef.current) {
          // In real implementation:
          // const yandexMap = new ymaps.Map(mapRef.current, {
          //   center: [41.2995, 69.2401], // Tashkent center
          //   zoom: 12,
          //   controls: ['zoomControl', 'searchControl', 'typeSelector', 'fullscreenControl']
          // })

          // For demo, create a realistic map container
          const mapContainer = mapRef.current
          mapContainer.innerHTML = `
            <div style="width: 100%; height: 100%; position: relative; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);">
              <!-- Yandex Maps Tiles Simulation -->
              <div style="position: absolute; inset: 0; background-image: 
                radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 60% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 50%);
                background-size: 200px 200px;">
              </div>
              
              <!-- Street Grid -->
              <svg style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.3;">
                <defs>
                  <pattern id="tashkent-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f59e0b" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tashkent-grid)"/>
              </svg>
              
              <!-- Tashkent Districts -->
              <div style="position: absolute; top: 15%; left: 20%; width: 25%; height: 20%; background: rgba(251, 191, 36, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #92400e; font-weight: 500;">
                Мирзо-Улугбек
              </div>
              <div style="position: absolute; top: 40%; left: 15%; width: 30%; height: 25%; background: rgba(34, 197, 94, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #166534; font-weight: 500;">
                Чилонзор
              </div>
              <div style="position: absolute; top: 20%; right: 25%; width: 20%; height: 30%; background: rgba(59, 130, 246, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #1e40af; font-weight: 500;">
                Шайхонтохур
              </div>
              <div style="position: absolute; bottom: 25%; left: 30%; width: 25%; height: 20%; background: rgba(168, 85, 247, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #7c3aed; font-weight: 500;">
                Яшнобод
              </div>
              <div style="position: absolute; top: 60%; right: 20%; width: 25%; height: 20%; background: rgba(239, 68, 68, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #dc2626; font-weight: 500;">
                Юнусобод
              </div>
              
              <!-- Major Streets -->
              <div style="position: absolute; top: 25%; left: 10%; transform: rotate(-15deg); font-size: 11px; color: #374151; font-weight: 500; background: rgba(255,255,255,0.8); padding: 2px 6px; border-radius: 4px;">
                пр. Амира Темура
              </div>
              <div style="position: absolute; top: 45%; left: 60%; transform: rotate(90deg); font-size: 11px; color: #374151; font-weight: 500; background: rgba(255,255,255,0.8); padding: 2px 6px; border-radius: 4px;">
                ул. Навои
              </div>
              <div style="position: absolute; top: 70%; left: 40%; font-size: 11px; color: #374151; font-weight: 500; background: rgba(255,255,255,0.8); padding: 2px 6px; border-radius: 4px;">
                ул. Шота Руставели
              </div>
              <div style="position: absolute; top: 35%; right: 15%; transform: rotate(-45deg); font-size: 11px; color: #374151; font-weight: 500; background: rgba(255,255,255,0.8); padding: 2px 6px; border-radius: 4px;">
                Кольцевая дорога
              </div>
              
              <!-- Landmarks -->
              <div style="position: absolute; top: 30%; left: 45%; width: 8px; height: 8px; background: #dc2626; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
              <div style="position: absolute; top: 29%; left: 46%; font-size: 10px; color: #dc2626; font-weight: 600; background: rgba(255,255,255,0.9); padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
                Регистан
              </div>
              
              <div style="position: absolute; top: 50%; left: 55%; width: 8px; height: 8px; background: #059669; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
              <div style="position: absolute; top: 49%; left: 56%; font-size: 10px; color: #059669; font-weight: 600; background: rgba(255,255,255,0.9); padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
                Парк Навои
              </div>
              
              <!-- Yandex Logo -->
              <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(255,255,255,0.95); padding: 4px 8px; border-radius: 4px; font-size: 11px; color: #374151; font-weight: 500; border: 1px solid #e5e7eb;">
                © Яндекс.Карты
              </div>
              
              <!-- Scale -->
              <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(255,255,255,0.95); padding: 4px 8px; border-radius: 4px; font-size: 10px; color: #6b7280; border: 1px solid #e5e7eb;">
                1 км
              </div>
            </div>
          `

          setMap(mapContainer)
          setMapLoaded(true)
        }
      } catch (error) {
        console.error("Failed to load Yandex Maps:", error)
      }
    }

    initYandexMap()
  }, [])

  // Add markers when locations change
  useEffect(() => {
    if (mapLoaded && map && locations.length > 0) {
      // Clear existing markers
      markersRef.current = []

      // Add new markers
      locations.forEach((location, index) => {
        addMarkerToMap(location, index)
      })
    }
  }, [mapLoaded, map, locations])

  const addMarkerToMap = (location: VisitedLocation, index: number) => {
    console.log(location);
    
    if (!map) return

    // Convert coordinates to pixel position (simplified)
    const bounds = {
      north: 41.35,
      south: 41.25,
      east: 69.35,
      west: 69.15,
    }

    const x = ((location.coordinates.lng - bounds.west) / (bounds.east - bounds.west)) * 100
    const y = ((bounds.north - location.coordinates.lat) / (bounds.north - bounds.south)) * 100

    // Create marker element
    const marker = document.createElement("div")
    marker.style.cssText = `
      position: absolute;
      left: ${Math.max(2, Math.min(98, x))}%;
      top: ${Math.max(2, Math.min(98, y))}%;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: ${selectedLocation?.id === location.id ? 1000 : 100 + index};
      transition: all 0.2s ease;
    `

    const markerContent = `
      <div style="position: relative;">
        <!-- Shadow -->
        <div style="position: absolute; top: 2px; left: 2px; width: 32px; height: 32px; background: rgba(0,0,0,0.2); border-radius: 50%; filter: blur(2px);"></div>
        
        <!-- Main marker -->
        <div style="
          width: 32px; 
          height: 32px; 
          background: ${location.status === "delivered" ? "#f59e0b" : "#ef4444"}; 
          border: 3px solid white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          ${selectedLocation?.id === location.id ? "box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);" : ""}
        ">
          <svg width="16" height="16" fill="white">
            ${
              location.status === "delivered"
                ? '<path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>'
                : '<path d="M6 6l6 6M6 12l6-6" stroke="white" strokeWidth="2"/>'
            }
          </svg>
        </div>
        
        <!-- Number badge -->
        <div style="
          position: absolute; 
          top: -4px; 
          right: -4px; 
          width: 20px; 
          height: 20px; 
          background: #dc2626; 
          color: white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 11px; 
          font-weight: bold;
          border: 2px solid white;
        ">
          ${index + 1}
        </div>
        
        <!-- Tooltip -->
        <div style="
          position: absolute; 
          bottom: 40px; 
          left: 50%; 
          transform: translateX(-50%); 
          background: rgba(0,0,0,0.9); 
          color: white; 
          padding: 8px 12px; 
          border-radius: 6px; 
          font-size: 12px; 
          white-space: nowrap; 
          opacity: 0; 
          pointer-events: none; 
          transition: opacity 0.2s;
          z-index: 1000;
        " class="marker-tooltip">
          <div style="font-weight: 600;">${location.clientName}</div>
          <div style="opacity: 0.8; font-size: 11px;">${location.visitTime}</div>
          <div style="
            position: absolute; 
            top: 100%; 
            left: 50%; 
            transform: translateX(-50%); 
            border: 4px solid transparent; 
            border-top-color: rgba(0,0,0,0.9);
          "></div>
        </div>
      </div>
    `

    marker.innerHTML = markerContent

    // Add hover effects
    marker.addEventListener("mouseenter", () => {
      const tooltip = marker.querySelector(".marker-tooltip") as HTMLElement
      if (tooltip) tooltip.style.opacity = "1"
      marker.style.transform = "translate(-50%, -50%) scale(1.1)"
    })

    marker.addEventListener("mouseleave", () => {
      const tooltip = marker.querySelector(".marker-tooltip") as HTMLElement
      if (tooltip) tooltip.style.opacity = "0"
      if (selectedLocation?.id !== location.id) {
        marker.style.transform = "translate(-50%, -50%) scale(1)"
      }
    })

    // Add click handler
    marker.addEventListener("click", () => {
      setSelectedLocation(location)
    })

    map.appendChild(marker)
    markersRef.current.push(marker)
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(18, prev + 1))
    // In real implementation: map.setZoom(map.getZoom() + 1)
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(8, prev - 1))
    // In real implementation: map.setZoom(map.getZoom() - 1)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading map data...</p>
        </div>
      </div>
    )
  }

  if (!selectedExpeditor) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select an expeditor to view their route</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative overflow-hidden">
      {/* Map Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">Я</span>
              </div>
            </div>
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 font-medium">Loading Yandex Maps...</p>
            <p className="text-sm text-gray-500">Tashkent Region</p>
          </div>
        </div>
      )}

      {/* Yandex Map Container */}
      <div
        ref={mapRef}
        className={`absolute inset-0 transition-opacity duration-500 ${mapLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ minHeight: "400px" }}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-30 space-y-2">
        <Card className="p-3 bg-white/95 backdrop-blur-sm">
          <div className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">Я</span>
            </div>
            {selectedExpeditor.name}'s Route
          </div>
          <div className="text-xs text-gray-500">{locations.length} locations visited</div>
          <div className="text-xs text-gray-500">Zoom: {zoomLevel}</div>
          <div className="text-xs text-gray-500">Region: Tashkent</div>
        </Card>

        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0 bg-white/95 backdrop-blur-sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0 bg-white/95 backdrop-blur-sm"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white/95 backdrop-blur-sm">
            <Layers className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white/95 backdrop-blur-sm">
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Location Details Popup */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 z-40">
          <Card className="max-w-md mx-auto shadow-xl border-2 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-yellow-600" />
                  {selectedLocation.clientName}
                </CardTitle>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selectedLocation.address}
              </p>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Arrived: {selectedLocation.visitTime}</span>
              </div>

              {selectedLocation.checkoutTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Left: {selectedLocation.checkoutTime}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge variant={selectedLocation.status === "delivered" ? "default" : "destructive"}>
                  {selectedLocation.status}
                </Badge>
                {selectedLocation.notes && (
                  <span className="text-xs text-gray-500 italic">"{selectedLocation.notes}"</span>
                )}
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <strong>Coordinates:</strong> {selectedLocation.coordinates.lat.toFixed(6)},{" "}
                {selectedLocation.coordinates.lng.toFixed(6)}
              </div>

              <div className="text-xs text-gray-400 flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Я</span>
                </div>
                Powered by Yandex Maps
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {locations.length === 0 && mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-sm">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No locations visited in selected date range</p>
            <p className="text-sm text-gray-500 mt-2">Select a different date range to see routes</p>
          </div>
        </div>
      )}
    </div>
  )
}
