"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Check, Expeditor } from "@/lib/types"

interface MapComponentProps {
  checks: Check[]
  selectedExpeditor: Expeditor | null
  loading: boolean
  onCheckClick: (check: Check) => void
  focusLocation?: { lat: number; lng: number } | null
}

declare global {
  interface Window {
    ymaps: any
  }
}

/**
 * Loads a remote script and resolves when it finishes downloading.
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If the same script is already being loaded, reuse it
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing?.dataset.loaded === "true") return resolve()
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)))
      return
    }

    const s = document.createElement("script")
    s.src = src
    s.async = true
    s.dataset.loaded = "false"
    s.onload = () => {
      s.dataset.loaded = "true"
      resolve()
    }
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

/**
 * Waits for window.ymaps to be defined and ready.
 */
function waitForYmaps(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    function check() {
      if (window.ymaps?.ready) {
        window.ymaps.ready(resolve)
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Yandex Maps timed out while initialising"))
        return
      }
      requestAnimationFrame(check)
    }

    check()
  })
}

export function MapComponent({ checks, selectedExpeditor, loading, onCheckClick, focusLocation }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [status, setStatus] = useState<"initial" | "loading" | "ready" | "error">("initial")
  const [errorMsg, setErrorMsg] = useState("")

  /* -------------------------------------------------------------------------- */
  /*                              LOAD YANDEX MAPS                              */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (status !== "initial") return
    setStatus("loading")

    const init = async () => {
      try {
        // 1️⃣ Attempt to load through our secure proxy first
        await loadScript("/api/yandex-maps?lang=en_US&v=2.1")

        // Did the proxy actually provide the API?
        if (!window.ymaps) {
          throw new Error("Proxy returned a stub – falling back to demo key")
        }
      } catch (proxyErr) {
        console.warn("[Map] Proxy load failed:", proxyErr)
        // 2️⃣ Fallback to Yandex’s public demo key (limited quota)
        try {
          await loadScript("https://api-maps.yandex.ru/2.1/?apikey=0d3f3e04-6d70-41e3-8ad4-5b3e3e075a23&lang=en_US")
        } catch (cdnErr) {
          setErrorMsg(`Cannot load Yandex Maps: ${(cdnErr as Error).message}`)
          setStatus("error")
          return
        }
      }

      try {
        await waitForYmaps()
      } catch (readyErr) {
        setErrorMsg((readyErr as Error).message)
        setStatus("error")
        return
      }

      // 3️⃣ Initialise the map
      if (mapContainerRef.current) {
        mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
          center: [41.2995, 69.2401],
          zoom: 11,
          controls: ["zoomControl", "fullscreenControl", "typeSelector", "trafficControl"],
        })
      }
      setStatus("ready")
    }

    init().catch((err: unknown) => {
      console.error("[Map] Unexpected error:", err)
      setErrorMsg((err as Error).message)
      setStatus("error")
    })
  }, [status])

  /* -------------------------------------------------------------------------- */
  /*                              RENDER MARKERS                                */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return
    const map = mapRef.current

    // Clear previous markers
    markersRef.current.forEach((m) => map.geoObjects.remove(m))
    markersRef.current = []

    // Add new markers
    checks.forEach((check) => {
      if (!check.check_lat || !check.check_lon) return

      const placemark = new window.ymaps.Placemark(
        [check.check_lat, check.check_lon],
        {
          balloonContentHeader: check.check_id,
          balloonContentBody: `
            <div>
              <p><strong>Expeditor:</strong> ${check.ekispiditor ?? "—"}</p>
              <p><strong>Amount:</strong> ${(check.total_sum ?? 0).toLocaleString()} UZS</p>
              <p><strong>Date:</strong> ${new Date(check.check_date).toLocaleDateString()}</p>
            </div>
          `,
        },
        {
          preset:
            selectedExpeditor && check.ekispiditor === selectedExpeditor.name
              ? "islands#redDotIcon"
              : "islands#blueDotIcon",
        },
      )

      placemark.events.add("click", () => onCheckClick(check))
      map.geoObjects.add(placemark)
      markersRef.current.push(placemark)
    })

    // Fit bounds
    if (markersRef.current.length > 1) {
      try {
        const bounds = map.geoObjects.getBounds()
        if (bounds) map.setBounds(bounds, { checkZoomRange: true, margin: 40 })
      } catch {
        /* ignore */
      }
    }
  }, [checks, onCheckClick, selectedExpeditor, status])

  /* -------------------------------------------------------------------------- */
  /*                                 FOCUS POINT                                */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (status !== "ready" || !focusLocation || !mapRef.current) return
    mapRef.current.setCenter([focusLocation.lat, focusLocation.lng], 15, { duration: 400 })
  }, [focusLocation, status])

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */
  if (status === "error") {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <Card className="w-96">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="font-medium">Map failed to load</p>
            <p className="text-xs text-gray-500">{errorMsg}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {(loading || status === "loading") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 z-10">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          <p className="mt-2 text-sm text-gray-600">{loading ? "Loading checks…" : "Initialising map…"}</p>
        </div>
      )}

      {/* Quick legend */}
      {status === "ready" && (
        <div className="absolute top-4 right-4 bg-white/90 rounded shadow p-3 space-y-2 text-xs">
          <p className="font-semibold">Legend</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" /> Check
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600" /> Selected expeditor
          </div>
        </div>
      )}

      {/* Bottom-left info box */}
      {selectedExpeditor && status === "ready" && (
        <div className="absolute bottom-4 left-4 bg-white/90 rounded shadow p-4 min-w-64">
          <div className="flex gap-3 items-center">
            <MapPin className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold">{selectedExpeditor.name}</h4>
              <p className="text-xs text-gray-600">
                {checks.length} checks&nbsp;&bull;&nbsp;
                {checks.reduce((s, c) => s + (c.total_sum || 0), 0).toLocaleString()} UZS
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
