"use client"

import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from "react"
import { Navigation, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useTranslation } from "../lib/simple-i18n"
import type { Check, Expeditor } from "@/lib/types"

interface OptimizedMapComponentProps {
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

// Memoized map component to prevent unnecessary re-renders
const OptimizedMapComponent = memo<OptimizedMapComponentProps>(({
  checks,
  selectedExpeditor,
  loading,
  onCheckClick,
  focusLocation
}) => {
  const { t } = useTranslation()
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "fallback">("loading")
  const [errMsg, setErrMsg] = useState("")

  // Memoized checks data to prevent unnecessary map updates
  const memoizedChecks = useMemo(() => {
    return checks.filter(check => check.check_lat && check.check_lon)
  }, [checks])

  // Memoized selected expeditor ID
  const selectedExpeditorId = useMemo(() => {
    return selectedExpeditor?.id || null
  }, [selectedExpeditor?.id])

  // Memoized focus location
  const memoizedFocusLocation = useMemo(() => {
    return focusLocation ? { lat: focusLocation.lat, lng: focusLocation.lng } : null
  }, [focusLocation?.lat, focusLocation?.lng])

  // Load Yandex Maps script
  const loadScript = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is not available"))
        return
      }

      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`)
      if (existingScript) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load script"))
      document.head.appendChild(script)
    })
  }, [])

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check for fallback implementation
    if (window.ymaps && window.ymaps._loaded) {
      setStatus("fallback")
      return
    }

    const init = async () => {
      try {
        await loadScript("/api/yandex-maps?v=2.1&lang=en_US")

        if (!window.ymaps) {
          console.warn("[OptimizedMap] Yandex Maps not loaded")
          setStatus("fallback")
          return
        }

        if (window.ymaps._loaded) {
          console.log("[OptimizedMap] Using fallback Yandex Maps implementation")
          setStatus("fallback")
          return
        }

        // Wait for Yandex Maps to be ready with timeout
        await Promise.race([
          new Promise<void>((resolve) => window.ymaps.ready(resolve)),
          new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error("Yandex Maps timeout")), 10000)
          )
        ])

        // Create map instance only once
        if (!mapInstanceRef.current) {
          const mapContainer = mapRef.current
          if (!mapContainer) return

          mapInstanceRef.current = new window.ymaps.Map(mapContainer, {
            center: [41.2995, 69.2401], // Tashkent coordinates
            zoom: 10,
            controls: ["zoomControl", "fullscreenControl", "typeSelector"]
          })
        }

        setStatus("ready")
      } catch (e: unknown) {
        console.error("[OptimizedMap] init error:", e)
        setErrMsg((e as Error).message)
        setStatus("error")
      }
    }

    init()
  }, [loadScript])

  // Update map markers efficiently
  useEffect(() => {
    if (status !== "ready" || !mapInstanceRef.current || !window.ymaps) return

    try {
      const map = mapInstanceRef.current
      
      // Remove old markers
      markersRef.current.forEach((marker) => {
        map.geoObjects.remove(marker)
      })
      markersRef.current.clear()

      // Add new markers
      if (Array.isArray(memoizedChecks)) {
        memoizedChecks.forEach((check) => {
          if (!check.check_lat || !check.check_lon) return

          try {
            const markerId = `marker-${check.id}`
            
            // Skip if marker already exists
            if (markersRef.current.has(markerId)) return

            const placemark = new window.ymaps.Placemark(
              [check.check_lat, check.check_lon],
              {
                balloonContent: `
                  <div style="padding: 8px;">
                    <h4>${check.check_number}</h4>
                    <p><strong>Status:</strong> ${check.status}</p>
                    <p><strong>Amount:</strong> ${check.check_sum?.toLocaleString()} UZS</p>
                    <p><strong>Date:</strong> ${new Date(check.check_date).toLocaleDateString()}</p>
                  </div>
                `,
                iconContent: check.status === "delivered" ? "✓" : "●",
                iconColor: check.status === "delivered" ? "#22c55e" : 
                          check.status === "pending" ? "#f59e0b" : "#ef4444"
              },
              {
                preset: "islands#circleIcon",
                iconColor: check.status === "delivered" ? "#22c55e" : 
                          check.status === "pending" ? "#f59e0b" : "#ef4444"
              }
            )

            // Add click handler
            placemark.events.add("click", () => {
              onCheckClick?.(check)
            })

            map.geoObjects.add(placemark)
            markersRef.current.set(markerId, placemark)
          } catch (placemarkError) {
            console.warn("[OptimizedMap] Error creating placemark:", placemarkError)
          }
        })
      }

      // Fit map to show all markers
      if (memoizedChecks.length > 0) {
        try {
          const bounds = map.geoObjects.getBounds()
          if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true })
          }
        } catch (boundsError) {
          console.warn("[OptimizedMap] Error setting bounds:", boundsError)
        }
      }
    } catch (error) {
      console.error("[OptimizedMap] Error in map update:", error)
    }
  }, [status, memoizedChecks, onCheckClick])

  // Handle focus location changes
  useEffect(() => {
    if (status !== "ready" || !memoizedFocusLocation || !mapInstanceRef.current) return

    try {
      mapInstanceRef.current.setCenter([memoizedFocusLocation.lat, memoizedFocusLocation.lng], 15)
    } catch (error) {
      console.warn("[OptimizedMap] Error setting focus location:", error)
    }
  }, [status, memoizedFocusLocation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy()
        } catch (error) {
          console.warn("[OptimizedMap] Error destroying map:", error)
        }
      }
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

OptimizedMapComponent.displayName = "OptimizedMapComponent"

export default OptimizedMapComponent
