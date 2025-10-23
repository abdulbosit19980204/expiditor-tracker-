'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, MapPin, Clock, Users, Eye, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { YandexMap } from '@/components/yandex-map'

interface SameLocationViolation {
  id: number
  window_start: string
  window_end: string
  window_duration_minutes: number
  center_lat: number
  center_lon: number
  total_checks: number
  unique_expiditors: number
  most_active_expiditor: string
  most_active_count: number
  avg_checks_per_expiditor: number
  check_ids: string[]
  check_details: any
  analysis_date: string
  created_at: string
}

interface PaginationInfo {
  page: number
  page_size: number
  total_count: number
  total_pages: number
}

interface SummaryInfo {
  total_violations: number
  total_checks: number
  unique_expeditors: number
}

export default function SameLocationViolationsPage() {
  const [violations, setViolations] = useState<SameLocationViolation[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0
  })
  const [summary, setSummary] = useState<SummaryInfo>({
    total_violations: 0,
    total_checks: 0,
    unique_expeditors: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<SameLocationViolation | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    expeditor: '',
    expeditorSelect: '',
    checkCount: '',
    duration: '',
    riskLevel: '',
    pageSize: '20'
  })
  
  // Available expeditors for dropdown
  const [expeditors, setExpeditors] = useState<string[]>([])

  const fetchViolations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.append('date_from', filters.dateFrom)
      if (filters.dateTo) params.append('date_to', filters.dateTo)
      if (filters.expeditor) params.append('expeditor', filters.expeditor)
      if (filters.expeditorSelect) params.append('expeditor_select', filters.expeditorSelect)
      if (filters.checkCount) params.append('check_count', filters.checkCount)
      if (filters.duration) params.append('duration', filters.duration)
      if (filters.riskLevel) params.append('risk_level', filters.riskLevel)
      params.append('page', pagination.page.toString())
      params.append('page_size', filters.pageSize)

      const response = await fetch(`/api/analytics/same-location-violations/?${params}`, {
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        setViolations(data.violations || [])
        setPagination(data.pagination || pagination)
        setSummary(data.summary || summary)
        
        // Update expeditors list for dropdown
        if (data.expeditors && Array.isArray(data.expeditors)) {
          setExpeditors(data.expeditors)
        }
      }
    } catch (error) {
      console.error('Error fetching same location violations:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page])

  useEffect(() => {
    fetchViolations()
  }, [fetchViolations])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setFilters(prev => ({ ...prev, pageSize: newPageSize }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const openDetailModal = (record: SameLocationViolation) => {
    setSelectedRecord(record)
    setIsDetailModalOpen(true)
  }

  const getRiskLevel = (checks: number) => {
    if (checks >= 10) return { label: 'Critical', color: 'bg-red-500' }
    if (checks >= 5) return { label: 'High', color: 'bg-orange-500' }
    return { label: 'Medium', color: 'bg-yellow-500' }
  }

  const getDurationLevel = (minutes: number) => {
    if (minutes >= 60) return { label: 'Long', color: 'bg-purple-500' }
    if (minutes >= 30) return { label: 'Medium', color: 'bg-blue-500' }
    return { label: 'Short', color: 'bg-green-500' }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Same Location Violations</h1>
        <p className="text-gray-600">Expeditors who issued multiple checks from the same location on the same day</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_violations}</div>
            <p className="text-xs text-muted-foreground">Same location incidents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_checks}</div>
            <p className="text-xs text-muted-foreground">Checks involved</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Expeditors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.unique_expeditors}</div>
            <p className="text-xs text-muted-foreground">Expeditors involved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Expeditor</label>
              <Input
                placeholder="Search expeditor..."
                value={filters.expeditor}
                onChange={(e) => handleFilterChange('expeditor', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Per Page</label>
              <Select value={filters.pageSize} onValueChange={handlePageSizeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Same Location Violations</CardTitle>
          <CardDescription>
            Showing {violations.length} of {pagination.total_count} violations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading violations...</p>
            </div>
          ) : violations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No same location violations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {violations.map((violation) => {
                const risk = getRiskLevel(violation.total_checks)
                return (
                  <div key={violation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={`${risk.color} text-white`}>
                          {risk.label}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {format(new Date(violation.window_start), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(violation)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Location:</span>
                        <p className="text-gray-600">
                          {violation.center_lat.toFixed(4)}, {violation.center_lon.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Total Checks:</span>
                        <p className="text-gray-600">{violation.total_checks}</p>
                      </div>
                      <div>
                        <span className="font-medium">Expeditor:</span>
                        <p className="text-gray-600">{violation.most_active_expiditor}</p>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p className="text-gray-600">{violation.window_duration_minutes} min</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.page_size) + 1} to{' '}
                {Math.min(pagination.page * pagination.page_size, pagination.total_count)} of{' '}
                {pagination.total_count} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Time Range</h4>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedRecord.window_start), 'MMM dd, yyyy HH:mm')} -{' '}
                    {format(new Date(selectedRecord.window_end), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Duration</h4>
                  <p className="text-sm text-gray-600">{selectedRecord.window_duration_minutes} minutes</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <p className="text-sm text-gray-600">
                    {selectedRecord.center_lat.toFixed(6)}, {selectedRecord.center_lon.toFixed(6)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Total Checks</h4>
                  <p className="text-sm text-gray-600">{selectedRecord.total_checks}</p>
                </div>
              </div>

              {/* Check List */}
              <div>
                <h4 className="font-medium mb-3">Check Details</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(() => {
                    let checks = []
                    if (selectedRecord.check_details?.checks) {
                      checks = selectedRecord.check_details.checks
                    } else if (selectedRecord.check_details?.check_ids && Array.isArray(selectedRecord.check_details.check_ids)) {
                      checks = selectedRecord.check_details.check_ids.map((checkId, idx) => ({
                        id: checkId,
                        client_name: 'Unknown Client',
                        time: 'Unknown Time',
                        expeditor: selectedRecord.check_details.expeditors?.[0] || selectedRecord.most_active_expiditor || 'Unknown',
                        lat: selectedRecord.center_lat || 0,
                        lon: selectedRecord.center_lon || 0,
                        status: 'Unknown'
                      }))
                    }
                    return checks.length > 0 ? (
                      checks.map((check, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <span className="font-medium">Check ID:</span>
                              <p className="text-gray-600">{check.id}</p>
                            </div>
                            <div>
                              <span className="font-medium">Client:</span>
                              <p className="text-gray-600">{check.client_name}</p>
                            </div>
                            <div>
                              <span className="font-medium">Time:</span>
                              <p className="text-gray-600">{check.time}</p>
                            </div>
                            <div>
                              <span className="font-medium">Expeditor:</span>
                              <p className="text-gray-600">{check.expeditor}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No check details available</p>
                    )
                  })()}
                </div>
              </div>

              {/* Map */}
              <div>
                <h4 className="font-medium mb-3">Location Map</h4>
                <YandexMap
                  height="420px"
                  locations={(() => {
                    let locations = []
                    if (selectedRecord.check_details?.checks) {
                      locations = selectedRecord.check_details.checks.map((c: any, i: number) => ({
                        id: i + 1,
                        lat: Number(c.lat),
                        lng: Number(c.lon),
                        expeditor: c.expeditor,
                        time: c.time,
                        status: c.status,
                      }))
                    } else if (selectedRecord.check_details?.check_ids && Array.isArray(selectedRecord.check_details.check_ids)) {
                      locations = selectedRecord.check_details.check_ids.map((checkId: string, i: number) => ({
                        id: i + 1,
                        lat: selectedRecord.center_lat || 0,
                        lng: selectedRecord.center_lon || 0,
                        expeditor: selectedRecord.check_details.expeditors?.[0] || selectedRecord.most_active_expiditor || 'Unknown',
                        time: 'Unknown Time',
                        status: 'Unknown',
                      }))
                    }
                    return locations
                  })()}
                  center={{ lat: selectedRecord.center_lat, lng: selectedRecord.center_lon }}
                  zoom={12}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
