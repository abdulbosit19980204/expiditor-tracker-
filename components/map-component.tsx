"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, Clock, Plus, Minus, Layers, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "./loading-spinner"
import { RealisticYandexMap } from "./realistic-yandex-map"
import type { VisitedLocation, Expeditor, Check } from "../lib/types"

interface MapComponentProps {
  locations: VisitedLocation[]
  loading: boolean
  selectedExpeditor: Expeditor | null
  onLocationClick?: (check: Check) => void
}

export function MapComponent({ locations, loading, selectedExpeditor, onLocationClick }: MapComponentProps) {
  const [selectedLocation, setSelectedLocation] = useState<VisitedLocation | null>(null)
  const [zoomLevel, setZoomLevel] = useState(12)
  const [mapProvider, setMapProvider] = useState<"yandex" | "openstreet">("yandex")
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Simulate map initialization
  useEffect(() => {
    const initializeMap = async () => {
      setMapLoaded(false)
      // Simulate loading time for map provider
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMapLoaded(true)
    }

    initializeMap()
  }, [mapProvider])

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(18, prev + 1))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(8, prev - 1))

  const handleLocationClick = (location: VisitedLocation) => {
    setSelectedLocation(location)
    if (onLocationClick) {
      onLocationClick(location.check)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount)
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
      {/* Map Provider Selection */}
      <div className="absolute top-4 left-4 z-30">
        <Select value={mapProvider} onValueChange={(value: "yandex" | "openstreet") => setMapProvider(value)}>
          <SelectTrigger className="w-40 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yandex">Yandex Maps</SelectItem>
            <SelectItem value="openstreet">OpenStreet Map</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Map Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-20">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">
              Loading {mapProvider === "yandex" ? "Yandex Maps" : "OpenStreet Map"}...
            </p>
          </div>
        </div>
      )}

      {/* Map Component */}
      <RealisticYandexMap
        locations={locations}
        loading={loading}
        selectedExpeditor={selectedExpeditor}
        onLocationClick={handleLocationClick}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-20 space-y-2">
        <Card className="p-3">
          <div className="text-sm font-medium text-gray-700 mb-1">{selectedExpeditor.name}'s Route</div>
          <div className="text-xs text-gray-500">{locations.length} locations visited</div>
          <div className="text-xs text-gray-500">Zoom: {zoomLevel}</div>
          <div className="text-xs text-gray-500">Provider: {mapProvider === "yandex" ? "Yandex" : "OSM"}</div>
        </Card>

        <div className="flex flex-col gap-1">
          <Button size="sm" variant="outline" onClick={handleZoomIn} className="h-8 w-8 p-0 bg-white">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut} className="h-8 w-8 p-0 bg-white">
            <Minus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white">
            <Layers className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white">
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Location Details Popup */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <Card className="max-w-md mx-auto shadow-xl border-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className={`h-5 w-5 ${mapProvider === "yandex" ? "text-yellow-600" : "text-green-600"}`} />
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

              {/* Check Information */}
              {selectedLocation.check && selectedLocation.check.check_detail && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Check ID:</span>
                    <span className="text-sm font-mono">{selectedLocation.check.check_id}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(selectedLocation.check.check_detail.total_sum || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Check Date:</span>
                    <span className="text-sm">
                      {new Date(selectedLocation.check.check_detail.check_date).toLocaleString("uz-UZ", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {selectedLocation.check.check_detail.checkURL && (
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => window.open(selectedLocation.check.check_detail?.checkURL, "_blank")}
                    >
                      View QR Code
                    </Button>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <strong>Coordinates:</strong> {selectedLocation.coordinates.lat.toFixed(6)},{" "}
                {selectedLocation.coordinates.lng.toFixed(6)}
              </div>

              <div className="text-xs text-gray-400">
                Map Provider: {mapProvider === "yandex" ? "Yandex Maps" : "OpenStreetMap"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {locations.length === 0 && mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No locations visited yet</p>
            <p className="text-sm text-gray-500">Locations will appear here when the expeditor visits clients</p>
          </div>
        </div>
      )}
    </div>
  )
}
