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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Download,
  X,
  Loader2
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
      // Reset map state when opening
      setMapLoaded(false)
      setMapInstance(null)
      fetchViolationDetail()
    }
  }, [open, expeditor, token, dateFrom, dateTo])

  useEffect(() => {
    if (open && data && !mapLoaded && data.all_check_locations.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap()
      }, 500)
    }
    
    // Cleanup on close
    return () => {
      if (mapInstance) {
        try {
          mapInstance.destroy()
        } catch (e) {
          console.error('Error destroying map:', e)
        }
      }
    }
  }, [open, data, mapLoaded])

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
    if (!data || !data.all_check_locations.length) {
      console.log('No data or locations for map')
      return
    }

    // Check if map container exists
    const mapContainer = document.getElementById('yandex-map')
    if (!mapContainer) {
      console.log('Map container not found')
      return
    }

    try {
      // Load Yandex Maps script
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

        // Clear existing map if any
        mapContainer.innerHTML = ''

        // Create map centered on first location
        const firstLocation = data.all_check_locations[0]
        const map = new ymaps.Map('yandex-map', {
          center: [firstLocation.lat, firstLocation.lng],
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        })

        // Add markers for all check locations
        data.all_check_locations.forEach((location) => {
          if (!location.lat || !location.lng) return
          
          const placemark = new ymaps.Placemark(
            [location.lat, location.lng],
            {
              balloonContent: `
                <div style="padding: 10px;">
                  <strong>${location.client_name || 'Unknown'}</strong><br/>
                  Check ID: ${location.check_id}<br/>
                  Time: ${location.time ? new Date(location.time).toLocaleString() : 'N/A'}<br/>
                  Status: ${location.status || 'Unknown'}<br/>
                  ${location.address ? `Address: ${location.address}` : ''}
                </div>
              `,
              hintContent: location.client_name || 'Check Location'
            },
            {
              preset: location.status === 'delivered' 
                ? 'islands#greenDotIcon' 
                : location.status === 'failed'
                ? 'islands#redDotIcon'
                : 'islands#yellowDotIcon'
            }
          )
          
          map.geoObjects.add(placemark)
        })

        setMapInstance(map)
        setMapLoaded(true)
        console.log(`Map loaded with ${data.all_check_locations.length} locations`)
      })
    } catch (error) {
      console.error('Error loading Yandex Maps:', error)
      setMapLoaded(false)
    }
  }

  const showViolationOnMap = (violation: ViolationInstance) => {
    setSelectedViolation(violation)
    
    if (mapInstance && violation.center_lat && violation.center_lon) {
      mapInstance.setCenter([violation.center_lat, violation.center_lon], 14)
      
      // Add a circle to show the violation radius
      const ymaps = (window as any).ymaps
      const circle = new ymaps.Circle(
        [[violation.center_lat, violation.center_lon], violation.radius_meters],
        {},
        {
          fillColor: violation.severity === 'critical' 
            ? '#ff000055' 
            : violation.severity === 'warning'
            ? '#ff990055'
            : '#ffff0055',
          strokeColor: violation.severity === 'critical' 
            ? '#ff0000' 
            : violation.severity === 'warning'
            ? '#ff9900'
            : '#ffff00',
          strokeWidth: 2
        }
      )
      
      // Clear previous circles
      mapInstance.geoObjects.each((geoObject: any) => {
        if (geoObject.geometry?.getType() === 'Circle') {
          mapInstance.geoObjects.remove(geoObject)
        }
      })
      
      mapInstance.geoObjects.add(circle)
    }
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Violation Details
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {expeditor}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {data && (
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading violation details...</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-gray-600">No data available</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="bg-gradient-to-br from-red-50 to-red-100">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-gray-600 mb-1">Violations</div>
                  <div className="text-2xl font-bold text-red-600">
                    {data.summary.total_violations}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-gray-600 mb-1">Total Checks</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {data.summary.total_checks_involved}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-gray-600 mb-1">Avg Radius</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(data.summary.avg_radius_meters)}m
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-gray-600 mb-1">Max Radius</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(data.summary.max_radius_meters)}m
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-gray-600 mb-1">Min Radius</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(data.summary.min_radius_meters)}m
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="map" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map">
                  <MapPin className="h-4 w-4 mr-2" />
                  Map View
                </TabsTrigger>
                <TabsTrigger value="list">
                  <Target className="h-4 w-4 mr-2" />
                  Violations List
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Check Locations Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      id="yandex-map" 
                      className="w-full h-[500px] rounded-lg border-2 border-gray-200"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list" className="space-y-3">
                {data.violations.map((violation, idx) => (
                  <Card 
                    key={violation.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedViolation?.id === violation.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => showViolationOnMap(violation)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getSeverityColor(violation.severity)} border`}>
                              {violation.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {violation.total_checks} checks
                            </span>
                            <span className="text-sm text-gray-600">
                              • {Math.round(violation.radius_meters)}m radius
                            </span>
                          </div>

                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>
                                {new Date(violation.window_start).toLocaleString()} 
                                {' - '}
                                {new Date(violation.window_end).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>
                                Center: {violation.center_lat?.toFixed(4)}, {violation.center_lon?.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {violation.check_ids.slice(0, 5).map((checkId) => (
                                <Badge key={checkId} variant="outline" className="text-xs">
                                  {checkId}
                                </Badge>
                              ))}
                              {violation.check_ids.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{violation.check_ids.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            showViolationOnMap(violation)
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Show on Map
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

