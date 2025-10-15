"use client"

import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from "react"
import { Navigation, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useTranslation } from "../../lib/simple-i18n"
import type { Check, Expeditor } from "@/lib/types"

interface PerformanceOptimizedMapProps {
  checks: Check[]
  selectedExpeditor: Expeditor | null
  loading: boolean
  onCheckClick?: (check: Check) => void
  focusLocation?: { lat: number; lng: number } | null
}

declare global {
  interface Window {
    ymaps: any
    selectCheck: (checkId: string) => void
  }
}

// Memoized map component with performance optimizations
const PerformanceOptimizedMap = memo<PerformanceOptimizedMapProps>(({
  checks,
  selectedExpeditor,
  loading,
  onCheckClick,
  focusLocation
}) => {
  const { t } = useTranslation()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const lastChecksRef = useRef<Check[]>([])
  const lastSelectedExpeditorRef = useRef<string | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "fallback">("loading")
  const [errMsg, setErrMsg] = useState("")

  // Memoized checks data - only update when actual data changes
  const memoizedChecks = useMemo(() => {
    const validChecks = checks.filter(check => 
      check.check_lat && 
      check.check_lon && 
      !isNaN(check.check_lat) && 
      !isNaN(check.check_lon)
    )
    
    // Only return new array if data actually changed
    if (JSON.stringify(validChecks) !== JSON.stringify(lastChecksRef.current)) {
      lastChecksRef.current = validChecks
      return validChecks
    }
    return lastChecksRef.current
  }, [checks])

  // Memoized selected expeditor ID
  const selectedExpeditorId = useMemo(() => {
    const currentId = selectedExpeditor?.id || null
    if (currentId !== lastSelectedExpeditorRef.current) {
      lastSelectedExpeditorRef.current = currentId
      return currentId
    }
    return lastSelectedExpeditorRef.current
  }, [selectedExpeditor?.id])

  // Memoized focus location
  const memoizedFocusLocation = useMemo(() => {
    return focusLocation ? { 
      lat: Number(focusLocation.lat), 
      lng: Number(focusLocation.lng) 
    } : null
  }, [focusLocation?.lat, focusLocation?.lng])

  // Stable map initialization function
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      if (typeof window === "undefined") {
        setStatus("error")
        setErrMsg("Window is not available")
        return
      }

      // Check if Yandex Maps is available
      if (!window.ymaps) {
        console.warn("[PerformanceMap] Yandex Maps not available, using fallback")
        setStatus("fallback")
        return
      }

      // Check if it's the fallback implementation
      if (window.ymaps._loaded === true) {
        console.warn("[PerformanceMap] Using fallback Yandex Maps implementation")
        setStatus("fallback")
        return
      }

      // Initialize map with stable configuration
      const map = new window.ymaps.Map(mapRef.current, {
        center: [41.2995, 69.2401], // Tashkent coordinates
        zoom: 10,
        controls: ['zoomControl', 'fullscreenControl', 'typeSelector', 'geolocationControl']
      })

      mapInstanceRef.current = map
      setStatus("ready")
      
      console.log("[PerformanceMap] Map initialized successfully")
    } catch (error) {
      console.error("[PerformanceMap] Map initialization error:", error)
      setStatus("error")
      setErrMsg(error instanceof Error ? error.message : "Unknown error")
    }
  }, [])

  // Load Yandex Maps script with error handling
  const loadYandexMaps = useCallback(async () => {
    if (typeof window === "undefined") return

    try {
      // Check if already loaded
      if (window.ymaps && window.ymaps._loaded !== true) {
        await initializeMap()
        return
      }

      // Load script
      const script = document.createElement("script")
      script.src = "/api/yandex-maps?v=2.1&lang=en_US"
      script.async = true
      
      script.onload = async () => {
        console.log("[PerformanceMap] Yandex Maps script loaded")
        await initializeMap()
      }
      
      script.onerror = () => {
        console.warn("[PerformanceMap] Failed to load Yandex Maps script, using fallback")
        setStatus("fallback")
      }

      document.head.appendChild(script)
    } catch (error) {
      console.error("[PerformanceMap] Error loading Yandex Maps:", error)
      setStatus("fallback")
    }
  }, [initializeMap])

  // Initialize map on mount
  useEffect(() => {
    loadYandexMaps()
  }, [loadYandexMaps])

  // Efficiently update map markers - only when checks data actually changes
  const updateMapMarkers = useCallback(() => {
    if (status !== "ready" || !mapInstanceRef.current || !window.ymaps) return

    try {
      const map = mapInstanceRef.current
      
      // Clear existing markers
      map.geoObjects.removeAll()
      markersRef.current.clear()

      // Add new markers efficiently
      if (Array.isArray(memoizedChecks) && memoizedChecks.length > 0) {
        memoizedChecks.forEach((check) => {
          try {
            const lat = Number(check.check_lat)
            const lng = Number(check.check_lon)
            
            if (isNaN(lat) || isNaN(lng)) return

            // Create placemark with optimized properties
            const placemark = new window.ymaps.Placemark([lat, lng], {
              balloonContentHeader: `${t('check')} #${check.id}`,
              balloonContentBody: `
                <div>
                  <p><strong>${t('expeditor')}:</strong> ${check.expeditor_name || 'N/A'}</p>
                  <p><strong>${t('status')}:</strong> ${check.status}</p>
                  <p><strong>${t('amount')}:</strong> ${check.amount || 0}</p>
                  <p><strong>${t('date')}:</strong> ${check.created_at ? new Date(check.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              `,
              balloonContentFooter: check.id.toString()
            }, {
              preset: 'islands#blueDotIcon',
              draggable: false
            })

            // Add click event
            placemark.events.add('click', () => {
              if (onCheckClick) {
                onCheckClick(check)
              }
            })

            map.geoObjects.add(placemark)
            markersRef.current.set(check.id.toString(), placemark)
          } catch (placemarkError) {
            console.warn("[PerformanceMap] Error creating placemark:", placemarkError)
          }
        })

        // Fit map to show all markers
        try {
          const bounds = map.geoObjects.getBounds()
          if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true, duration: 300 })
          }
        } catch (boundsError) {
          console.warn("[PerformanceMap] Error setting bounds:", boundsError)
        }
      }
    } catch (error) {
      console.error("[PerformanceMap] Error updating map markers:", error)
    }
  }, [status, memoizedChecks, onCheckClick, t])

  // Update markers when data changes
  useEffect(() => {
    updateMapMarkers()
  }, [updateMapMarkers])

  // Handle focus location changes efficiently
  useEffect(() => {
    if (status !== "ready" || !memoizedFocusLocation || !mapInstanceRef.current) return

    try {
      mapInstanceRef.current.setCenter(
        [memoizedFocusLocation.lat, memoizedFocusLocation.lng], 
        15, 
        { duration: 500 }
      )
    } catch (error) {
      console.warn("[PerformanceMap] Error setting focus location:", error)
    }
  }, [status, memoizedFocusLocation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy()
          mapInstanceRef.current = null
        } catch (error) {
          console.warn("[PerformanceMap] Error destroying map:", error)
        }
      }
      markersRef.current.clear()
    }
  }, [])

  // Render loading state
  if (loading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('loading')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render error state
  if (status === "error") {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{t('error')}</p>
            <p className="text-sm text-gray-500 mt-2">{errMsg}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render fallback state
  if (status === "fallback") {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('mapNotAvailable')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('usingFallbackMode')}</p>
            <div className="mt-4 space-y-2">
              {memoizedChecks.slice(0, 5).map((check) => (
                <div key={check.id} className="text-sm text-gray-600 dark:text-gray-400">
                  {t('check')} #{check.id} - {check.expeditor_name || 'N/A'}
                </div>
              ))}
              {memoizedChecks.length > 5 && (
                <p className="text-xs text-gray-500">
                  +{memoizedChecks.length - 5} {t('moreChecks')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render map
  return (
    <Card className="h-96">
      <CardContent className="p-0 h-full">
        <div 
          ref={mapRef} 
          className="w-full h-full rounded-lg"
          style={{ minHeight: "384px" }}
        />
      </CardContent>
    </Card>
  )
})

PerformanceOptimizedMap.displayName = "PerformanceOptimizedMap"

export default PerformanceOptimizedMap
