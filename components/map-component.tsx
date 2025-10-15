"use client"

import { useEffect, useRef, useState, memo } from "react"
import { Navigation, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useTranslation } from "react-i18next"
import type { Check, Expeditor } from "@/lib/types"

interface MapComponentProps {
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

const canUseWasm = async () => {
  try {
    const modBytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])
    await WebAssembly.compile(modBytes)
    return true
  } catch {
    return false
  }
}

function groupChecksByDay(checks: Check[]) {
  const groups: Record<string, Check[]> = {}
  for (const c of checks) {
    if (!c.check_lat || !c.check_lon) continue
    const d = new Date(c.check_date)
    const key =
      d.getFullYear() +
      "-" +
      (d.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      d.getDate().toString().padStart(2, "0")
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }
  for (const key in groups) {
    groups[key].sort((a, b) => new Date(a.check_date).getTime() - new Date(b.check_date).getTime())
  }
  return groups
}

const pathColors = ["#2563eb", "#22c55e", "#f59e42", "#e11d48", "#a21caf", "#0ea5e9", "#fbbf24"]
function getPathColor(idx: number) {
  return pathColors[idx % pathColors.length]
}

export const MapComponent = memo(function MapComponent({
  checks,
  selectedExpeditor,
  loading,
  onCheckClick,
  focusLocation,
}: MapComponentProps) {
  const { t } = useTranslation()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading")
  const [errMsg, setErrMsg] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    
    if (window.ymaps) {
      setStatus("ready")
      return
    }

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement("script")
        s.src = src
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject(new Error(`Failed to load ${src}`))
        document.head.appendChild(s)
      })

    const init = async () => {
      try {
        // Use our API route instead of direct Yandex API to avoid conflicts
        await loadScript("/api/yandex-maps?v=2.1&lang=en_US")

        // Check if ymaps is available
        if (!window.ymaps) {
          console.warn("[Map] Yandex Maps not loaded")
          setStatus("fallback")
          return
        }

        // Check if we're using the fallback implementation
        if (window.ymaps._loaded) {
          console.log("[Map] Using fallback Yandex Maps implementation")
          setStatus("fallback")
          return
        }

        const wasmOk = await canUseWasm()
        if (!wasmOk) {
          console.warn("[Map] WebAssembly not available")
          setStatus("fallback")
          return
        }

        // Wait for ymaps to be ready with timeout
        await Promise.race([
          new Promise((r) => window.ymaps.ready(r)),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Yandex Maps timeout")), 10000))
        ])

        if (mapContainerRef.current) {
          mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
            center: [41.2995, 69.2401],
            zoom: 11,
            controls: ["zoomControl", "fullscreenControl", "typeSelector", "trafficControl"],
          })
        }

        setStatus("ready")
      } catch (e: unknown) {
        console.error("[Map] init error:", e)
        setErrMsg((e as Error).message)
        setStatus("error")
      }
    }

    init()
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy?.()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.ymaps) return

    try {
      const map = mapRef.current
      map.geoObjects.removeAll()

      // Ensure checks is an array
      if (Array.isArray(checks)) {
        checks.forEach((c) => {
          if (!c.check_lat || !c.check_lon) return

          try {
            const placemark = new window.ymaps.Placemark(
              [c.check_lat, c.check_lon],
              {
                balloonContentHeader: `Check ${c.check_id}`,
                balloonContentBody: `
                  <div style="font-family:sans-serif">
                    <p><strong>Expeditor:</strong> ${c.ekispiditor ?? "-"}</p>
                    <p><strong>Sum:</strong> ${(c.total_sum ?? 0).toLocaleString()} UZS</p>
                    <p><strong>Date:</strong> ${new Date(c.check_date).toLocaleDateString()}</p>
                    <button
                      onclick="window.selectCheck('${c.check_id}')"
                      style="margin-top:8px;padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer"
                    >Details</button>
                  </div>
                `,
                balloonContentFooter: `KKM ${c.kkm_number ?? "-"}`,
              },
              {
                preset: c.total_sum ? "islands#greenDotIcon" : "islands#redDotIcon",
              },
            )

            placemark.events.add("click", () => onCheckClick?.(c))
            map.geoObjects.add(placemark)
          } catch (placemarkError) {
            console.warn("[Map] Error creating placemark:", placemarkError)
          }
        })
      }

      if (selectedExpeditor && Array.isArray(checks)) {
        const expChecks = checks.filter((c) => c.ekispiditor === selectedExpeditor.name && c.check_lat && c.check_lon)
        const grouped = groupChecksByDay(expChecks)
        const days = Object.keys(grouped).sort()
        days.forEach((day, idx) => {
          const coords = grouped[day].map((c) => [c.check_lat, c.check_lon])
          if (coords.length > 1) {
            try {
              const polyline = new window.ymaps.Polyline(
                coords,
                {},
                {
                  strokeColor: getPathColor(idx),
                  strokeWidth: 4,
                  strokeOpacity: 0.8,
                },
              )
              map.geoObjects.add(polyline)
            } catch (polylineError) {
              console.warn("[Map] Error creating polyline:", polylineError)
            }
          }
        })
      }

      if (checks.length && Array.isArray(checks)) {
        try {
          const b = map.geoObjects.getBounds()
          if (b) map.setBounds(b, { checkZoomRange: true, zoomMargin: 40 })
        } catch (boundsError) {
          console.warn("[Map] Error setting bounds:", boundsError)
        }
      }

      window.selectCheck = (id: string) => {
        const found = checks.find((c) => c.check_id === id)
        found && onCheckClick?.(found)
      }
    } catch (error) {
      console.error("[Map] Error in map update:", error)
    }
  }, [status, checks, onCheckClick, selectedExpeditor])

  useEffect(() => {
    if (status !== "ready" || !focusLocation || !mapRef.current) return
    
    try {
      mapRef.current.setCenter([focusLocation.lat, focusLocation.lng], 15)
    } catch (error) {
      console.warn("[Map] Error setting focus location:", error)
    }
  }, [status, focusLocation])

  if (status === "error") {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <Card className="w-80">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="font-medium">Failed to load map</p>
            <p className="text-xs text-gray-500">{errMsg}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "fallback") {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 relative">
        <img
          src="/placeholder.svg?height=400&width=800"
          alt={t("mapPlaceholder")}
          className="object-cover w-full h-full opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="w-80">
            <CardContent className="p-6 text-center">
              <p className="text-gray-700 font-medium">Map preview unavailable</p>
              <p className="text-sm text-gray-500 mt-2">Will work in production</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {(loading || status === "loading") && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-gray-600">{loading ? "Loading checks…" : "Loading map…"}</span>
        </div>
      )}

      {status === "ready" && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-10">
          <div className="mt-2">
            <div className="flex flex-wrap gap-2">
              {selectedExpeditor &&
                (() => {
                  const expChecks = checks.filter(
                    (c) => c.ekispiditor === selectedExpeditor.name && c.check_lat && c.check_lon,
                  )
                  const grouped = groupChecksByDay(expChecks)
                  const days = Object.keys(grouped).sort()
                  return days.map((day, idx) => (
                    <div key={day} className="flex items-center gap-1">
                      <div className="w-4 h-1.5 rounded" style={{ background: getPathColor(idx) }} />
                      <span className="text-xs">{new Date(day).toLocaleDateString("uz-UZ")}</span>
                    </div>
                  ))
                })()}
            </div>
          </div>
        </div>
      )}

      {selectedExpeditor && status === "ready" && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-64 z-10">
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
})
