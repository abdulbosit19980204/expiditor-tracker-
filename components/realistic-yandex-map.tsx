"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "./loading-spinner"
import type { VisitedLocation, Expeditor } from "../lib/types"

interface RealisticYandexMapProps {
  locations: VisitedLocation[]
  loading: boolean
  selectedExpeditor: Expeditor | null
}

export function RealisticYandexMap({ locations, loading, selectedExpeditor }: RealisticYandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<VisitedLocation | null>(null)
  const [zoomLevel, setZoomLevel] = useState(14)

  // Initialize realistic Yandex Map
  useEffect(() => {
    const initRealisticYandexMap = async () => {
      try {
        // Simulate API loading
        await new Promise((resolve) => setTimeout(resolve, 2000))

        if (mapRef.current) {
          const mapContainer = mapRef.current
          mapContainer.innerHTML = `
            <div style="width: 100%; height: 100%; position: relative; background: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              
              <!-- Yandex Maps Header -->
              <div style="position: absolute; top: 0; left: 0; right: 0; height: 60px; background: white; border-bottom: 1px solid #e0e0e0; z-index: 100; display: flex; align-items: center; padding: 0 16px;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                  <div style="width: 32px; height: 32px; background: #ffdb4d; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #333;">
                    Я
                  </div>
                  <div style="flex: 1; max-width: 400px; position: relative;">
                    <input type="text" placeholder="Поиск и выбор мест" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: #f8f8f8;" />
                    <div style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #999;">
                      <svg width="16" height="16" fill="currentColor"><path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM15 14l-3-3"/></svg>
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button style="padding: 6px; border: none; background: none; border-radius: 4px; cursor: pointer;">
                    <svg width="20" height="20" fill="#666"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  </button>
                  <div style="color: #333; font-size: 14px; font-weight: 500;">Ташкент 🌡️ 39°C</div>
                </div>
              </div>

              <!-- Category Buttons -->
              <div style="position: absolute; top: 70px; left: 16px; z-index: 90; display: flex; gap: 8px; flex-wrap: wrap;">
                <button style="background: white; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 12px; color: #333; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  🍽️ Где поесть
                </button>
                <button style="background: white; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 12px; color: #333; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ⛽ Заправки
                </button>
                <button style="background: white; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 12px; color: #333; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  🛒 Продукты
                </button>
                <button style="background: white; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 12px; color: #333; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  🏨 Гостиницы
                </button>
                <button style="background: white; border: 1px solid #ddd; border-radius: 20px; padding: 8px 16px; font-size: 12px; color: #333; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  💊 Аптеки
                </button>
              </div>

              <!-- Main Map Area with Real Tashkent Layout -->
              <div style="position: absolute; top: 60px; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                
                <!-- Street Network -->
                <svg style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.4;" viewBox="0 0 1000 800">
                  <!-- Major Roads -->
                  <path d="M0 400 L1000 400" stroke="#d4d4d8" strokeWidth="3"/>
                  <path d="M500 0 L500 800" stroke="#d4d4d8" strokeWidth="3"/>
                  <path d="M200 200 L800 600" stroke="#d4d4d8" strokeWidth="2"/>
                  <path d="M800 200 L200 600" stroke="#d4d4d8" strokeWidth="2"/>
                  
                  <!-- Secondary Roads -->
                  <path d="M0 200 L1000 200" stroke="#e4e4e7" strokeWidth="2"/>
                  <path d="M0 600 L1000 600" stroke="#e4e4e7" strokeWidth="2"/>
                  <path d="M300 0 L300 800" stroke="#e4e4e7" strokeWidth="2"/>
                  <path d="M700 0 L700 800" stroke="#e4e4e7" strokeWidth="2"/>
                  
                  <!-- Minor Streets -->
                  <path d="M0 100 L1000 100" stroke="#f4f4f5" strokeWidth="1"/>
                  <path d="M0 300 L1000 300" stroke="#f4f4f5" strokeWidth="1"/>
                  <path d="M0 500 L1000 500" stroke="#f4f4f5" strokeWidth="1"/>
                  <path d="M0 700 L1000 700" stroke="#f4f4f5" strokeWidth="1"/>
                  <path d="M100 0 L100 800" stroke="#f4f4f5" strokeWidth="1"/>
                  <path d="M400 0 L400 800" stroke="#f4f4f5" strokeWidth="1"/>
                  <path d="M600 0 L600 800" stroke="#f4f4f5" strokeWidth="1"/>
                  <path d="M800 0 L800 800" stroke="#f4f4f5" strokeWidth="1"/>
                  <path d="M900 0 L900 800" stroke="#f4f4f5" strokeWidth="1"/>
                </svg>

                <!-- Districts and Areas -->
                <div style="position: absolute; top: 15%; left: 10%; width: 25%; height: 20%; background: rgba(168, 85, 247, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #7c3aed; font-weight: 600; border: 1px solid rgba(168, 85, 247, 0.2);">
                  АЛМАЗАРСКИЙ<br/>РАЙОН
                </div>
                
                <div style="position: absolute; top: 40%; left: 5%; width: 30%; height: 25%; background: rgba(34, 197, 94, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #059669; font-weight: 600; border: 1px solid rgba(34, 197, 94, 0.2);">
                  ЧИЛОНЗОР
                </div>
                
                <div style="position: absolute; top: 20%; right: 15%; width: 25%; height: 30%; background: rgba(59, 130, 246, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #2563eb; font-weight: 600; border: 1px solid rgba(59, 130, 246, 0.2);">
                  ШАЙХОНТОХУР
                </div>
                
                <div style="position: absolute; bottom: 25%; left: 25%; width: 25%; height: 20%; background: rgba(239, 68, 68, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #dc2626; font-weight: 600; border: 1px solid rgba(239, 68, 68, 0.2);">
                  ЯШНОБОД
                </div>
                
                <div style="position: absolute; top: 55%; right: 10%; width: 28%; height: 22%; background: rgba(251, 191, 36, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #d97706; font-weight: 600; border: 1px solid rgba(251, 191, 36, 0.2);">
                  ЮНУСОБОД
                </div>

                <!-- Parks and Green Areas -->
                <div style="position: absolute; top: 25%; left: 40%; width: 15%; height: 12%; background: rgba(34, 197, 94, 0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #166534; font-weight: 500;">
                  Национальный<br/>парк<br/>Alley Boy
                </div>
                
                <div style="position: absolute; top: 60%; left: 55%; width: 12%; height: 10%; background: rgba(34, 197, 94, 0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #166534; font-weight: 500;">
                  Парк<br/>Навои
                </div>

                <!-- Water Bodies -->
                <div style="position: absolute; top: 70%; left: 15%; width: 20%; height: 8%; background: rgba(59, 130, 246, 0.3); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #1e40af; font-weight: 500;">
                  Анхор канал
                </div>

                <!-- Major Landmarks -->
                <div style="position: absolute; top: 35%; left: 48%; width: 8px; height: 8px; background: #dc2626; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
                <div style="position: absolute; top: 32%; left: 49%; font-size: 11px; color: #dc2626; font-weight: 600; background: rgba(255,255,255,0.95); padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  Ташкент Сити
                </div>

                <!-- Metro Stations -->
                <div style="position: absolute; top: 45%; left: 35%; width: 12px; height: 12px; background: #1e40af; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  <div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div>
                </div>
                <div style="position: absolute; top: 42%; left: 36%; font-size: 10px; color: #1e40af; font-weight: 600; background: rgba(255,255,255,0.95); padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
                  М Космонавтов
                </div>

                <div style="position: absolute; top: 55%; left: 45%; width: 12px; height: 12px; background: #1e40af; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  <div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div>
                </div>
                <div style="position: absolute; top: 52%; left: 46%; font-size: 10px; color: #1e40af; font-weight: 600; background: rgba(255,255,255,0.95); padding: 1px 4px; border-radius: 3px; white-space: nowrap;">
                  М Мустакиллик
                </div>

                <!-- Street Names -->
                <div style="position: absolute; top: 28%; left: 20%; transform: rotate(-15deg); font-size: 11px; color: #4b5563; font-weight: 500; background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  пр. Амира Темура
                </div>
                
                <div style="position: absolute; top: 50%; left: 65%; transform: rotate(90deg); font-size: 11px; color: #4b5563; font-weight: 500; background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  ул. Навои
                </div>
                
                <div style="position: absolute; top: 65%; left: 40%; font-size: 11px; color: #4b5563; font-weight: 500; background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  ул. Шота Руставели
                </div>
                
                <div style="position: absolute; top: 40%; right: 20%; transform: rotate(-30deg); font-size: 11px; color: #4b5563; font-weight: 500; background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  Кольцевая дорога
                </div>

                <!-- Airport -->
                <div style="position: absolute; bottom: 15%; right: 25%; display: flex; align-items: center; gap: 4px; font-size: 11px; color: #6b7280; background: rgba(255,255,255,0.9); padding: 3px 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ✈️ Аэропорт Ташкент Ислама Каримова
                </div>
              </div>

              <!-- Map Controls -->
              <div style="position: absolute; bottom: 20px; right: 20px; z-index: 100; display: flex; flex-direction: column; gap: 8px;">
                <button style="width: 40px; height: 40px; background: white; border: 1px solid #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 18px; font-weight: bold; color: #333;">
                  +
                </button>
                <button style="width: 40px; height: 40px; background: white; border: 1px solid #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 18px; font-weight: bold; color: #333;">
                  −
                </button>
                <button style="width: 40px; height: 40px; background: white; border: 1px solid #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                  <svg width="20" height="20" fill="#666"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <button style="width: 40px; height: 40px; background: white; border: 1px solid #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                  <svg width="20" height="20" fill="#666"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </button>
              </div>

              <!-- Yandex Logo -->
              <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(255,255,255,0.95); padding: 6px 12px; border-radius: 4px; font-size: 12px; color: #333; font-weight: 600; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                © Яндекс
              </div>
              
              <!-- Scale -->
              <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(255,255,255,0.95); padding: 4px 8px; border-radius: 4px; font-size: 11px; color: #6b7280; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                500 м
              </div>
            </div>
          `

          setMap(mapContainer)
          setMapLoaded(true)
        }
      } catch (error) {
        console.error("Failed to load realistic Yandex Maps:", error)
      }
    }

    initRealisticYandexMap()
  }, [])

  // Add markers when locations change
  useEffect(() => {
    if (mapLoaded && map && locations.length > 0) {
      locations.forEach((location, index) => {
        addRealisticMarker(location, index)
      })
    }
  }, [mapLoaded, map, locations])

  const addRealisticMarker = (location: VisitedLocation, index: number) => {
    if (!map) return

    // Convert coordinates to pixel position
    const bounds = {
      north: 41.35,
      south: 41.25,
      east: 69.35,
      west: 69.15,
    }

    const x = ((location.coordinates.lng - bounds.west) / (bounds.east - bounds.west)) * 100
    const y = ((bounds.north - location.coordinates.lat) / (bounds.north - bounds.south)) * 100

    const marker = document.createElement("div")
    marker.style.cssText = `
      position: absolute;
      left: ${Math.max(2, Math.min(98, x))}%;
      top: ${Math.max(10, Math.min(90, y))}%;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: ${selectedLocation?.id === location.id ? 1000 : 200 + index};
      transition: all 0.2s ease;
    `

    const markerContent = `
      <div style="position: relative;">
        <!-- Realistic Yandex-style marker -->
        <div style="
          width: 28px; 
          height: 28px; 
          background: ${location.status === "delivered" ? "#ffdb4d" : "#ff4444"}; 
          border: 2px solid white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          ${selectedLocation?.id === location.id ? "box-shadow: 0 0 0 3px rgba(255, 219, 77, 0.5);" : ""}
        ">
          <div style="
            width: 16px; 
            height: 16px; 
            background: white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: ${location.status === "delivered" ? "#ffdb4d" : "#ff4444"};
          ">
            ${index + 1}
          </div>
        </div>
        
        <!-- Tooltip -->
        <div style="
          position: absolute; 
          bottom: 35px; 
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
      marker.style.transform = "translate(-50%, -50%) scale(1.15)"
    })

    marker.addEventListener("mouseleave", () => {
      const tooltip = marker.querySelector(".marker-tooltip") as HTMLElement
      if (tooltip) tooltip.style.opacity = "0"
      if (selectedLocation?.id !== location.id) {
        marker.style.transform = "translate(-50%, -50%) scale(1)"
      }
    })

    marker.addEventListener("click", () => {
      setSelectedLocation(location)
    })

    map.appendChild(marker)
  }

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(18, prev + 1))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(8, prev - 1))

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
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">Я</span>
              </div>
            </div>
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-700 font-medium text-lg">Loading Yandex Maps...</p>
            <p className="text-sm text-gray-500">Tashkent, Uzbekistan</p>
          </div>
        </div>
      )}

      {/* Realistic Yandex Map Container */}
      <div
        ref={mapRef}
        className={`absolute inset-0 transition-opacity duration-1000 ${mapLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ minHeight: "400px" }}
      />

      {/* Location Details Popup */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 z-50">
          <Card className="max-w-md mx-auto shadow-2xl border-2 bg-white/98 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Я</span>
                  </div>
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
                <div className="w-4 h-4 bg-yellow-400 rounded flex items-center justify-center">
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
        <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-sm z-40">
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
