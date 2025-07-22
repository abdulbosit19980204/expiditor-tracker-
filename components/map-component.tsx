// "use client"

// import { useEffect, useRef, useState } from "react"
// import { Navigation, Clock, AlertCircle } from "lucide-react"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { LoadingSpinner } from "@/components/loading-spinner"
// import type { Check, Expeditor } from "@/lib/types"

// interface MapComponentProps {
//   checks: Check[]
//   selectedExpeditor: Expeditor | null
//   loading: boolean
//   onCheckClick?: (check: Check) => void
//   focusLocation?: { lat: number; lng: number } | null
// }

// declare global {
//   interface Window {
//     ymaps: any
//     selectCheck: (checkId: string) => void
//   }
// }

// // Helper: simple WASM probe
// const canUseWasm = async () => {
//   try {
//     // Tiny empty module
//     const modBytes = new Uint8Array([
//       0x00,
//       0x61,
//       0x73,
//       0x6d, // \0asm  – WASM magic
//       0x01,
//       0x00,
//       0x00,
//       0x00, // version
//     ])
//     // If compile fails (network / policy) it will throw
//     await WebAssembly.compile(modBytes)
//     return true
//   } catch {
//     return false
//   }
// }

// export function MapComponent({ checks, selectedExpeditor, loading, onCheckClick, focusLocation }: MapComponentProps) {
//   const mapContainerRef = useRef<HTMLDivElement>(null)
//   const mapRef = useRef<any>(null)

//   const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading")
//   const [errMsg, setErrMsg] = useState("")

//   // Load Yandex Maps script (proxy → demo fallback)
//   useEffect(() => {
//     if (typeof window === "undefined" || window.ymaps) {
//       // Script already present
//       setStatus("ready")
//       return
//     }

//     const loadScript = (src: string) =>
//       new Promise<void>((resolve, reject) => {
//         const s = document.createElement("script")
//         s.src = src
//         s.async = true
//         s.onload = () => resolve()
//         s.onerror = () => reject(new Error(`Failed to load ${src}`))
//         document.head.appendChild(s)
//       })

//     const init = async () => {
//       try {
//         // 1. Try secure proxy (keeps key hidden)
//         await loadScript("/api/yandex-maps?lang=en_US&v=2.1")
//       } catch {
//         // 2. Fallback to Yandex demo key (limited quota)
//         await loadScript("https://api-maps.yandex.ru/2.1/?apikey=5080fe14-e264-4e2a-9e31-164d4b96da6e&lang=en_US")
//       }

//       // 3. Check WASM availability – preview sandbox may block it
//       const wasmOk = await canUseWasm()
//       if (!wasmOk) {
//         console.warn("[Map] WebAssembly not available – using placeholder")
//         setStatus("fallback")
//         return
//       }

//       // 4. Wait until the API signals it's ready
//       await new Promise((r) => window.ymaps.ready(r))

//       // 5. Initialise map
//       if (mapContainerRef.current) {
//         mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
//           center: [41.2995, 69.2401],
//           zoom: 11,
//           controls: ["zoomControl", "fullscreenControl", "typeSelector", "trafficControl"],
//         })
//       }

//       setStatus("ready")
//     }

//     init().catch((e: unknown) => {
//       console.error("[Map] init error:", e)
//       setErrMsg((e as Error).message)
//       setStatus("error")
//     })
//   }, [])

//   // Markers / updates
//   useEffect(() => {
//     if (status !== "ready" || !mapRef.current) return

//     const map = mapRef.current
//     map.geoObjects.removeAll()

//     checks.forEach((c) => {
//       if (!c.check_lat || !c.check_lon) return

//       const placemark = new window.ymaps.Placemark(
//         [c.check_lat, c.check_lon],
//         {
//           balloonContentHeader: `Check ${c.check_id}`,
//           balloonContentBody: `
//             <div style="font-family:sans-serif">
//               <p><strong>Expeditor:</strong> ${c.ekispiditor ?? "-"}</p>
//               <p><strong>Sum:</strong> ${(c.total_sum ?? 0).toLocaleString()} UZS</p>
//               <p><strong>Date:</strong> ${new Date(c.check_date).toLocaleDateString()}</p>
//               <button
//                 onclick="window.selectCheck('${c.check_id}')"
//                 style="margin-top:8px;padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer"
//               >Details</button>
//             </div>
//           `,
//           balloonContentFooter: `KKM ${c.kkm_number ?? "-"}`,
//         },
//         {
//           preset: c.total_sum ? "islands#greenDotIcon" : "islands#redDotIcon",
//         },
//       )

//       placemark.events.add("click", () => onCheckClick?.(c))
//       map.geoObjects.add(placemark)
//     })

//     // Fit bounds
//     if (checks.length) {
//       try {
//         const b = map.geoObjects.getBounds()
//         if (b) map.setBounds(b, { checkZoomRange: true, zoomMargin: 40 })
//       } catch {}
//     }

//     // Balloon → React
//     window.selectCheck = (id: string) => {
//       const found = checks.find((c) => c.check_id === id)
//       found && onCheckClick?.(found)
//     }
//   }, [status, checks, onCheckClick])

//   // Focus selected location
//   useEffect(() => {
//     if (status !== "ready" || !focusLocation || !mapRef.current) return
//     mapRef.current.setCenter([focusLocation.lat, focusLocation.lng], 15)
//   }, [status, focusLocation])

//   // UI
//   if (status === "error") {
//     return (
//       <div className="h-full flex items-center justify-center bg-gray-100">
//         <Card className="w-80">
//           <CardContent className="p-6 text-center space-y-3">
//             <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
//             <p className="font-medium">Failed to load map</p>
//             <p className="text-xs text-gray-500">{errMsg}</p>
//             <Button variant="outline" onClick={() => window.location.reload()}>
//               Retry
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   if (status === "fallback") {
//     return (
//       <div className="h-full flex items-center justify-center bg-gray-100 relative">
//         {/* Simple placeholder image */}
//         <img
//           src="/placeholder.svg?height=400&width=800"
//           alt="Map placeholder"
//           className="object-cover w-full h-full opacity-60"
//         />
//         <div className="absolute inset-0 flex items-center justify-center">
//           <Card className="w-80">
//             <CardContent className="p-6 text-center">
//               <p className="text-gray-700 font-medium">Map preview unavailable in sandbox</p>
//               <p className="text-sm text-gray-500 mt-2">Will work in production</p>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="relative h-full">
//       <div ref={mapContainerRef} className="w-full h-full" />

//       {(loading || status === "loading") && (
//         <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
//           <LoadingSpinner size="lg" />
//           <span className="ml-2 text-gray-600">{loading ? "Loading checks…" : "Loading map…"}</span>
//         </div>
//       )}

//       {/* Map Legend */}
//       {status === "ready" && (
//         <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-10">
//           <h4 className="font-semibold text-sm">Legend</h4>
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//             <span className="text-xs">Successful Check</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//             <span className="text-xs">Failed Check</span>
//           </div>
//         </div>
//       )}

//       {/* Selected Expeditor Info */}
//       {selectedExpeditor && status === "ready" && (
//         <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-64 z-10">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//               <Navigation className="h-5 w-5 text-blue-600" />
//             </div>
//             <div>
//               <h4 className="font-semibold">{selectedExpeditor.name}</h4>
//               <p className="text-sm text-gray-600">{selectedExpeditor.transport_number}</p>
//             </div>
//           </div>
//           <div className="mt-3 flex items-center justify-between">
//             <div className="flex items-center gap-1">
//               <Clock className="h-4 w-4 text-gray-500" />
//               <span className="text-sm text-gray-600">{Array.isArray(checks) ? checks.length : 0} checks</span>
//             </div>
//             <Badge variant="outline">
//               {Array.isArray(checks)
//                 ? checks.reduce((sum, check) => sum + (check.total_sum || 0), 0).toLocaleString()
//                 : 0}{" "}
//               UZS
//             </Badge>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


"use client"

import { useEffect, useRef, useState } from "react"
import { Navigation, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
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

// Helper: simple WASM probe
const canUseWasm = async () => {
  try {
    // Tiny empty module
    const modBytes = new Uint8Array([
      0x00,
      0x61,
      0x73,
      0x6d, // \0asm  – WASM magic
      0x01,
      0x00,
      0x00,
      0x00, // version
    ])
    // If compile fails (network / policy) it will throw
    await WebAssembly.compile(modBytes)
    return true
  } catch {
    return false
  }
}

// Helper: group checks by day (YYYY-MM-DD)
function groupChecksByDay(checks: Check[]) {
  const groups: Record<string, Check[]> = {}
  for (const c of checks) {
    if (!c.check_lat || !c.check_lon) continue
    const d = new Date(c.check_date)
    const key = d.getFullYear() + "-" + (d.getMonth() + 1).toString().padStart(2, "0") + "-" + d.getDate().toString().padStart(2, "0")
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }
  // Sort each day's checks by time
  for (const key in groups) {
    groups[key].sort((a, b) => new Date(a.check_date).getTime() - new Date(b.check_date).getTime())
  }
  return groups
}

// Helper: get color for a day index
const pathColors = [
  "#2563eb", // blue
  "#22c55e", // green
  "#f59e42", // orange
  "#e11d48", // red
  "#a21caf", // purple
  "#0ea5e9", // sky
  "#fbbf24", // yellow
]
function getPathColor(idx: number) {
  return pathColors[idx % pathColors.length]
}

export function MapComponent({ checks, selectedExpeditor, loading, onCheckClick, focusLocation }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading")
  const [errMsg, setErrMsg] = useState("")

  // Load Yandex Maps script (proxy → demo fallback)
  useEffect(() => {
    if (typeof window === "undefined" || window.ymaps) {
      // Script already present
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
        // 1. Try secure proxy (keeps key hidden)
        await loadScript("/api/yandex-maps?lang=en_US&v=2.1")
      } catch {
        // 2. Fallback to Yandex demo key (limited quota)
        await loadScript("https://api-maps.yandex.ru/2.1/?apikey=5080fe14-e264-4e2a-9e31-164d4b96da6e&lang=en_US")
      }

      // 3. Check WASM availability – preview sandbox may block it
      const wasmOk = await canUseWasm()
      if (!wasmOk) {
        console.warn("[Map] WebAssembly not available – using placeholder")
        setStatus("fallback")
        return
      }

      // 4. Wait until the API signals it's ready
      await new Promise((r) => window.ymaps.ready(r))

      // 5. Initialise map
      if (mapContainerRef.current) {
        mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
          center: [41.2995, 69.2401],
          zoom: 11,
          controls: ["zoomControl", "fullscreenControl", "typeSelector", "trafficControl"],
        })
      }

      setStatus("ready")
    }

    init().catch((e: unknown) => {
      console.error("[Map] init error:", e)
      setErrMsg((e as Error).message)
      setStatus("error")
    })
  }, [])

  // Markers / updates + polylines
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return

    const map = mapRef.current
    map.geoObjects.removeAll()

    // Draw placemarks
    checks.forEach((c) => {
      if (!c.check_lat || !c.check_lon) return

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
    })

    // Draw polylines for selected expeditor, colored by day
    if (selectedExpeditor) {
      const expChecks = checks
        .filter(
          (c) =>
            c.ekispiditor === selectedExpeditor.name &&
            c.check_lat &&
            c.check_lon
        )
      const grouped = groupChecksByDay(expChecks)
      const days = Object.keys(grouped).sort()
      days.forEach((day, idx) => {
        const coords = grouped[day].map((c) => [c.check_lat, c.check_lon])
        if (coords.length > 1) {
          const polyline = new window.ymaps.Polyline(coords, {}, {
            strokeColor: getPathColor(idx),
            strokeWidth: 4,
            strokeOpacity: 0.8,
          })
          map.geoObjects.add(polyline)
        }
      })
    }

    // Fit bounds
    if (checks.length) {
      try {
        const b = map.geoObjects.getBounds()
        if (b) map.setBounds(b, { checkZoomRange: true, zoomMargin: 40 })
      } catch {}
    }

    // Balloon → React
    window.selectCheck = (id: string) => {
      const found = checks.find((c) => c.check_id === id)
      found && onCheckClick?.(found)
    }
  }, [status, checks, onCheckClick, selectedExpeditor])

  // Focus selected location
  useEffect(() => {
    if (status !== "ready" || !focusLocation || !mapRef.current) return
    mapRef.current.setCenter([focusLocation.lat, focusLocation.lng], 15)
  }, [status, focusLocation])

  // UI
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
        {/* Simple placeholder image */}
        <img
          src="/placeholder.svg?height=400&width=800"
          alt="Map placeholder"
          className="object-cover w-full h-full opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="w-80">
            <CardContent className="p-6 text-center">
              <p className="text-gray-700 font-medium">Map preview unavailable in sandbox</p>
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

      {/* Map Legend */}
      {status === "ready" && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-10">
          <h4 className="font-semibold text-sm">Legend</h4>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs">Successful Check</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs">Failed Check</span>
          </div>
          <div className="mt-2">
            <div className="flex flex-wrap gap-2">
              {pathColors.map((color, idx) => (
                <div key={color} className="flex items-center gap-1">
                  <div className="w-4 h-1.5 rounded" style={{ background: color }} />
                  <span className="text-xs">Day {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Expeditor Info */}
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
              <span className="text-sm text-gray-600">{Array.isArray(checks) ? checks.length : 0} checks</span>
            </div>
            <Badge variant="outline">
              {Array.isArray(checks)
                ? checks.reduce((sum, check) => sum + (check.total_sum || 0), 0).toLocaleString()
                : 0}{" "}
              UZS
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}