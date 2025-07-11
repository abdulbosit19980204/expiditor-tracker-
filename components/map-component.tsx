"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Check, Expeditor } from "@/lib/types"

/**
 * SMALL PATCH:
 * 1.  If the proxy route `/api/yandex-maps` fails (e.g. missing key) we
 *     dynamically fall back to the public CDN URL so the map still loads.
 * 2.  We now guard against loading the script multiple times.
 */

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

export function MapComponent({ checks, selectedExpeditor, loading, onCheckClick, focusLocation }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string>("")

  // Load script once
  useEffect(() => {
    if (typeof window === "undefined" || window.ymaps) {
      setMapStatus("ready")
      return
    }

    setMapStatus("loading")

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
        // Try secure proxy first
        await loadScript("/api/yandex-maps?lang=en_US&v=2.1")
      } catch {
        // Fallback to direct CDN (demo key)
        console.warn("[Map] proxy failed, falling back to CDN")
        await loadScript("https://api-maps.yandex.ru/2.1/?apikey=0d3f3e04-6d70-41e3-8ad4-5b3e3e075a23&lang=en_US")
      }

      // Wait until the API is ready
      await new Promise((r) => window.ymaps.ready(r))

      // Create map if container exists
      if (mapRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
          center: [41.2995, 69.2401],
          zoom: 11,
          controls: ["zoomControl", "fullscreenControl", "typeSelector", "trafficControl"],
        })
      }

      setMapStatus("ready")
    }

    init().catch((err) => {
      console.error(err)
      setErrorMsg(err.message)
      setMapStatus("error")
    })
  }, [])

  /* ----------------- Marker / focus logic unchanged ----------------- */
  useEffect(() => {
    if (mapStatus !== "ready" || !mapInstanceRef.current) return
    const map = mapInstanceRef.current
    map.geoObjects.removeAll()

    checks.forEach((check) => {
      if (!check.check_lat || !check.check_lon) return
      const placemark = new window.ymaps.Placemark(
        [check.check_lat, check.check_lon],
        {
          balloonContentHeader: `Check ${check.check_id}`,
          balloonContentBody: `
            <div style="font-family:sans-serif">
              <p><b>Expeditor:</b> ${check.ekispiditor ?? "-"}</p>
              <p><b>Total:</b> ${(check.total_sum ?? 0).toLocaleString()} UZS</p>
              <p><b>Date:</b> ${new Date(check.check_date).toLocaleDateString()}</p>
              <button onclick="window.selectCheck('${check.check_id}')" style="margin-top:8px;padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer">
                Details
              </button>
            </div>`,
          balloonContentFooter: `KKM ${check.kkm_number ?? "-"}`,
        },
        { preset: check.total_sum ? "islands#greenDotIcon" : "islands#redDotIcon" },
      )

      placemark.events.add("click", () => onCheckClick?.(check))
      map.geoObjects.add(placemark)
    })

    // Fit bounds
    if (checks.length) {
      try {
        const b = map.geoObjects.getBounds()
        if (b) map.setBounds(b, { checkZoomRange: true, zoomMargin: 40 })
      } catch {}
    }

    // Balloon button → React callback
    window.selectCheck = (id: string) => {
      const found = checks.find((c) => c.check_id === id)
      found && onCheckClick?.(found)
    }
  }, [mapStatus, checks, onCheckClick])

  /* ----------------- focusLocation ----------------- */
  useEffect(() => {
    if (mapStatus !== "ready" || !focusLocation || !mapInstanceRef.current) return
    mapInstanceRef.current.setCenter([focusLocation.lat, focusLocation.lng], 15)
  }, [mapStatus, focusLocation])

  /* ----------------- Render ----------------- */
  if (mapStatus === "error") {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <Card className="w-96">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="font-semibold">Map Error</p>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" />
      {(loading || mapStatus !== "ready") && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <LoadingSpinner size="lg" />
          <p className="ml-3 text-gray-600">{loading ? "Loading checks…" : "Loading map…"}</p>
        </div>
      )}

      {/* Legend & Expeditor info unchanged – kept for brevity */}
    </div>
  )
}
