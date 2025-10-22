'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Clock,
  Target,
  AlertTriangle,
  Users,
  Download,
  X,
  ArrowLeft
} from 'lucide-react'
import { LoadingSpinner } from '@/components/loading-spinner'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7896/api'

interface CheckLocation {
  id: number
  check_id: string
  client_name: string
  lat: number
  lng: number
  time: string
  expeditor: string
  status: string
  address: string
}

interface ViolationInstance {
  id: number
  window_start: string
  window_end: string
  total_checks: number
  check_ids: string[]
  center_lat: number
  center_lon: number
  radius_meters: number
  expeditor: string
  check_locations: CheckLocation[]
  severity: 'critical' | 'warning' | 'minor'
}

interface ViolationDetail {
  expeditor: string
  summary: {
    total_violations: number
    total_checks_involved: number
    avg_radius_meters: number
    max_radius_meters: number
    min_radius_meters: number
  }
  violations: ViolationInstance[]
  all_check_locations: CheckLocation[]
}

interface ViolationDetailModalProps {
  open: boolean
  onClose: () => void
  expeditor: string | null
  token: string
  dateFrom?: string
  dateTo?: string
}

export function ViolationDetailModal({
  open,
  onClose,
  expeditor,
  token,
  dateFrom,
  dateTo
}: ViolationDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ViolationDetail | null>(null)
  const [selectedViolation, setSelectedViolation] = useState<ViolationInstance | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)

  useEffect(() => {
    if (open && expeditor && token) {
      setMapLoaded(false)
      setMapInstance(null)
      setSelectedViolation(null)
      fetchViolationDetail()
    }
  }, [open, expeditor, token, dateFrom, dateTo])

  useEffect(() => {
    if (open && selectedViolation && !mapLoaded) {
      setTimeout(() => {
        initializeMap()
      }, 300)
    }
    
    return () => {
      if (mapInstance) {
        try {
          mapInstance.destroy()
        } catch (e) {
          console.error('Error destroying map:', e)
        }
      }
    }
  }, [open, selectedViolation])

  const fetchViolationDetail = async () => {
    if (!expeditor) return

    setLoading(true)
    try {
      const queryParams = new URLSearchParams({ expeditor })
      if (dateFrom) queryParams.append('date_from', dateFrom)
      if (dateTo) queryParams.append('date_to', dateTo)

      const response = await fetch(
        `${API_BASE_URL}/analytics/violation-detail/?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch violation details')

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching violation details:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeMap = async () => {
    if (!selectedViolation) {
      console.log('No violation selected')
      return
    }

    const mapContainer = document.getElementById('violation-map-container')
    if (!mapContainer) {
      console.log('Map container not found')
      return
    }

    try {
      if (!(window as any).ymaps) {
        const script = document.createElement('script')
        script.src = 'https://api-maps.yandex.ru/2.1/?lang=en_RU&apikey=YOUR_YANDEX_API_KEY'
        script.async = true
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      await (window as any).ymaps.ready(() => {
        const ymaps = (window as any).ymaps
        
        mapContainer.innerHTML = ''

        const map = new ymaps.Map('violation-map-container', {
          center: [selectedViolation.center_lat, selectedViolation.center_lon],
          zoom: 15,
          controls: ['zoomControl', 'fullscreenControl']
        })

        // Add circle for violation radius
        const circle = new ymaps.Circle(
          [[selectedViolation.center_lat, selectedViolation.center_lon], selectedViolation.radius_meters],
          {},
          {
            fillColor: '#ff000033',
            strokeColor: '#ff0000',
            strokeWidth: 2
          }
        )
        map.geoObjects.add(circle)

        // Add markers for checks in this violation
        selectedViolation.check_locations.forEach((location) => {
          if (!location.lat || !location.lng) return
          
          const placemark = new ymaps.Placemark(
            [location.lat, location.lng],
            {
              balloonContent: `
                <div style="padding: 8px;">
                  <strong>${location.client_name || 'N/A'}</strong><br/>
                  ${location.check_id}<br/>
                  ${new Date(location.time).toLocaleString()}
                </div>
              `
            },
            {
              preset: 'islands#redDotIcon'
            }
          )
          
          map.geoObjects.add(placemark)
        })

        setMapInstance(map)
        setMapLoaded(true)
      })
    } catch (error) {
      console.error('Error loading map:', error)
      setMapLoaded(false)
    }
  }

  const showViolationOnMap = (violation: ViolationInstance) => {
    setMapLoaded(false)
    if (mapInstance) {
      try {
        mapInstance.destroy()
      } catch (e) {}
    }
    setMapInstance(null)
    setSelectedViolation(violation)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300'
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'minor': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const exportToCSV = () => {
    if (!data) return

    const csvContent = `Violation Details - ${data.expeditor}
Generated: ${new Date().toLocaleString()}

Summary:
Total Violations,${data.summary.total_violations}
Total Checks Involved,${data.summary.total_checks_involved}
Average Radius,${data.summary.avg_radius_meters}m
Max Radius,${data.summary.max_radius_meters}m
Min Radius,${data.summary.min_radius_meters}m

Violations:
ID,Start Time,End Time,Checks,Radius (m),Severity
${data.violations.map(v => 
  `${v.id},${new Date(v.window_start).toLocaleString()},${new Date(v.window_end).toLocaleString()},${v.total_checks},${v.radius_meters},${v.severity}`
).join('\n')}

Check Locations:
Check ID,Client,Time,Lat,Lng,Status
${data.all_check_locations.map(l =>
  `${l.check_id},"${l.client_name}",${new Date(l.time).toLocaleString()},${l.lat},${l.lng},${l.status}`
).join('\n')}
`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `violation-detail-${data.expeditor}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Violations - {expeditor}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 mt-0.5">
                {data?.summary.total_violations || 0} violations • {data?.summary.total_checks_involved || 0} checks
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-gray-600">No data available</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex">
            {/* Left - Violations List */}
            <div className="w-[28%] border-r border-gray-200 overflow-y-auto p-3">
              <div className="space-y-1.5">
                {data.violations.map((violation, idx) => (
                  <div
                    key={violation.id}
                    onClick={() => showViolationOnMap(violation)}
                    className={`p-2 border rounded cursor-pointer transition-all ${
                      selectedViolation?.id === violation.id
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        selectedViolation?.id === violation.id ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold mb-0.5">
                          {violation.total_checks} checks
                        </div>
                        <div className={`text-[10px] ${selectedViolation?.id === violation.id ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            <span>
                              {new Date(violation.window_start).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle - Checks List */}
            <div className="w-[37%] border-r border-gray-200 overflow-y-auto p-3 bg-gray-50">
              {!selectedViolation ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs">Select a violation</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-3 pb-2 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-semibold text-gray-900">
                        {selectedViolation.total_checks} Checks
                      </h3>
                      <Badge className={`${getSeverityColor(selectedViolation.severity)} border text-[10px] px-1.5 py-0`}>
                        {selectedViolation.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-gray-600">
                      <div>Radius: {Math.round(selectedViolation.radius_meters)}m</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(selectedViolation.window_start).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {selectedViolation.check_locations.map((check, idx) => (
                      <div
                        key={check.check_id}
                        className="p-2 bg-white border border-gray-200 rounded hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-[9px]">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-semibold text-gray-900 truncate mb-0.5">
                              {check.client_name || 'N/A'}
                            </div>
                            <div className="text-[9px] text-gray-600 space-y-0.5">
                              <div className="font-mono truncate">{check.check_id}</div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-2 w-2" />
                                {new Date(check.time).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-2 w-2" />
                                <span className="font-mono">
                                  {check.lat?.toFixed(4)}, {check.lng?.toFixed(4)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right - Map */}
            <div className="w-[35%] p-3 bg-white">
              {!selectedViolation ? (
                <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs">Select a violation</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 rounded border border-gray-200 overflow-hidden">
                    <div 
                      id="violation-map-container" 
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

