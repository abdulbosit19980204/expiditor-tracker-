'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { YandexMap } from '@/components/yandex-map'
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Clock,
  Filter as FilterIcon,
  Home,
  RefreshCw,
  User,
  LogOut,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/loading-spinner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7896/api'

interface CheckAnalytic {
  id: number
  window_start: string
  window_end: string
  window_duration_minutes: number
  total_checks: number
  unique_expeditors: number
  most_active_expiditor: string
  center_lat: number
  center_lon: number
  radius_meters: number
  check_ids: number[]
  check_details: {
    checks: Array<{
      id: string
      client_name: string
      time: string
      expeditor: string
      lat: number
      lon: number
    }>
  }
}

interface AnalyticsData {
  total_records: number
  total_checks: number
  unique_expeditors: number
  avg_checks_per_window: number
  results: CheckAnalytic[]
}

export default function ViolationAnalyticsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<CheckAnalytic | null>(null)
  const [showFilters, setShowFilters] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    expeditor: '',
    minChecks: '',
    maxChecks: '',
    radius: '',
    windowDuration: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchData()
  }, [user, router])

  // Auto-apply filters on change (no Apply button required)
  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => fetchData(), 150) // debounce a bit for type/select
    return () => clearTimeout(t)
  }, [filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom)
      if (filters.dateTo) queryParams.append('date_to', filters.dateTo)
      if (filters.expeditor && filters.expeditor !== 'all') queryParams.append('expiditor', filters.expeditor)
      if (filters.minChecks) queryParams.append('min_checks', filters.minChecks)
      if (filters.maxChecks) queryParams.append('max_checks', filters.maxChecks)
      if (filters.radius && filters.radius !== 'all') queryParams.append('max_radius', filters.radius)
      if (filters.windowDuration && filters.windowDuration !== 'all') queryParams.append('window_minutes', filters.windowDuration)

      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/analytics/?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to fetch analytics')

      const result = await response.json()
      
      // Ensure result is an array
      const resultsArray = Array.isArray(result) ? result : (result.results || [])
      
      // Calculate aggregated stats
      const analyticsData: AnalyticsData = {
        total_records: resultsArray.length || 0,
        total_checks: resultsArray.reduce((sum: number, r: CheckAnalytic) => sum + (r.total_checks || 0), 0),
        unique_expeditors: new Set(resultsArray.map((r: CheckAnalytic) => r.most_active_expiditor).filter(Boolean)).size,
        avg_checks_per_window: resultsArray.length > 0 
          ? resultsArray.reduce((sum: number, r: CheckAnalytic) => sum + (r.total_checks || 0), 0) / resultsArray.length 
          : 0,
        results: resultsArray
      }
      
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
    fetchData()
  }

  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      expeditor: '',
      minChecks: '',
      maxChecks: '',
      radius: '',
      windowDuration: ''
    })
    setCurrentPage(1)
    fetchData()
  }

  // Pagination
  const paginatedData = useMemo(() => {
    if (!data) return []
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return data.results.slice(start, end)
  }, [data, currentPage, itemsPerPage])

  const totalPages = data ? Math.ceil(data.results.length / itemsPerPage) : 0

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Check pattern analysis - Time windows and geographic clusters</p>
          </div>
          <div className="flex items-center gap-3">
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user?.first_name} {user?.last_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filters Toggle */}
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <FilterIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {/* Refresh */}
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Home */}
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FilterIcon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Date From</label>
                  <Input
                    type="datetime-local"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Date To</label>
                  <Input
                    type="datetime-local"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Expiditor</label>
                  <Input
                    type="text"
                    placeholder="Search expeditor..."
                    value={filters.expeditor}
                    onChange={(e) => setFilters({ ...filters, expeditor: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Min Checks</label>
                  <Input
                    type="number"
                    placeholder="Minimum checks"
                    value={filters.minChecks}
                    onChange={(e) => setFilters({ ...filters, minChecks: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Max Checks</label>
                  <Input
                    type="number"
                    placeholder="Maximum checks"
                    value={filters.maxChecks}
                    onChange={(e) => setFilters({ ...filters, maxChecks: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Radius (meters)</label>
                  <Select value={filters.radius} onValueChange={(value) => setFilters({ ...filters, radius: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="50">50m</SelectItem>
                      <SelectItem value="100">100m</SelectItem>
                      <SelectItem value="200">200m</SelectItem>
                      <SelectItem value="500">500m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Window Duration (min)</label>
                  <Select value={filters.windowDuration} onValueChange={(value) => setFilters({ ...filters, windowDuration: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="5">5 min</SelectItem>
                      <SelectItem value="10">10 min</SelectItem>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900">{data?.total_records || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Checks</p>
                  <p className="text-3xl font-bold text-gray-900">{data?.total_checks || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unique Expiditors</p>
                  <p className="text-3xl font-bold text-gray-900">{data?.unique_expeditors || 0}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Checks/Window</p>
                  <p className="text-3xl font-bold text-gray-900">{data?.avg_checks_per_window.toFixed(1) || '0.0'}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Table */}
        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Analytics Data</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Per page:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-20">
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
              <p className="text-sm text-gray-600 mt-2">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data?.results.length || 0)} of {data?.results.length || 0} records
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Time Window
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Most Active Expiditor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Checks ↑↓
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Total Checks
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Unique Expiditors
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Area
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(record.window_start)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(record.window_start)} - {formatTime(record.window_end)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs">
                          {record.window_duration_minutes} min
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div>Lat: {record.center_lat.toFixed(4)}</div>
                          <div>Lon: {record.center_lon.toFixed(4)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-blue-600">
                          {record.most_active_expiditor}
                        </div>
                        <div className="text-xs text-gray-500">
                          {record.check_details?.checks?.filter(c => c.expeditor === record.most_active_expiditor).length || 0} checks
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="text-sm">
                          {record.check_details?.checks?.length || record.total_checks}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="text-sm bg-green-100 text-green-800 hover:bg-green-100">
                          {record.total_checks}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="text-sm bg-purple-100 text-purple-800 hover:bg-purple-100">
                          {record.unique_expeditors}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-900">
                          Radius: {record.radius_meters}m around ({record.center_lat.toFixed(4)}, {record.center_lon.toFixed(4)})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedRecord(record)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Per page:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-20">
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
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Check Locations - {formatTime(selectedRecord.window_start)} - {formatTime(selectedRecord.window_end)}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analytics Summary */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Analytics Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Time Window:</span>
                      <span>{formatTime(selectedRecord.window_start)} - {formatTime(selectedRecord.window_end)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Checks:</span>
                      <span>{selectedRecord.total_checks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Most Active:</span>
                      <span>{selectedRecord.most_active_expiditor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Radius:</span>
                      <span>{selectedRecord.radius_meters}m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Check List */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Check List</h3>
                  <div className="max-h-[400px] overflow-y-auto space-y-3">
                    {(() => {
                      // Handle both old and new check_details formats
                      let checks = [];
                      
                      if (selectedRecord.check_details?.checks && Array.isArray(selectedRecord.check_details.checks)) {
                        // New format with checks array
                        checks = selectedRecord.check_details.checks;
                      } else if (selectedRecord.check_details?.check_ids && Array.isArray(selectedRecord.check_details.check_ids)) {
                        // Old format - create check objects from check_ids
                        checks = selectedRecord.check_details.check_ids.map((checkId, idx) => ({
                          id: checkId,
                          client_name: 'Loading...',
                          time: 'Loading...',
                          expeditor: selectedRecord.check_details.expeditors?.[0] || selectedRecord.most_active_expiditor || 'Unknown',
                          lat: selectedRecord.center_lat || 0,
                          lon: selectedRecord.center_lon || 0,
                          status: 'Loading...',
                          total_sum: 0
                        }));
                      } else if (selectedRecord.check_ids && Array.isArray(selectedRecord.check_ids)) {
                        // Fallback - use check_ids directly from record
                        checks = selectedRecord.check_ids.map((checkId, idx) => ({
                          id: checkId,
                          client_name: 'Loading...',
                          time: 'Loading...',
                          expeditor: selectedRecord.most_active_expiditor || 'Unknown',
                          lat: selectedRecord.center_lat || 0,
                          lon: selectedRecord.center_lon || 0,
                          status: 'Loading...',
                          total_sum: 0
                        }));
                      }
                      
                      return checks.length > 0 ? (
                        checks.map((check, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-blue-600">Check ID:</span>
                                  <span className="text-xs font-mono">{check.id}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">Client:</span>
                                  <span>{check.client_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Time:</span>
                                  <span>{check.time}</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">Expeditor:</span>
                                  <span className="text-blue-600">{check.expeditor}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">Location:</span>
                                  <span className="text-xs font-mono">{check.lat?.toFixed(6)}, {check.lon?.toFixed(6)}</span>
                                </div>
                                {check.total_sum && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Amount:</span>
                                    <span className="font-medium text-green-600">{check.total_sum} UZS</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-500">No check details available</p>
                          <p className="text-gray-400 text-sm mt-1">Check details will be available after running the analysis task</p>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map View */}
            <Card className="mt-4">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Location Map</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <YandexMap
                      height="500px"
                  locations={(() => {
                    // Handle both old and new check_details formats for map
                    let locations = [];
                    
                    if (selectedRecord.check_details?.checks) {
                      // New format with checks array
                      locations = selectedRecord.check_details.checks.map((c: any, i: number) => ({
                        id: i + 1,
                        lat: Number(c.lat),
                        lng: Number(c.lon),
                        expeditor: c.expeditor,
                        time: c.time,
                        status: c.status,
                      }));
                    } else if (selectedRecord.check_details?.check_ids && Array.isArray(selectedRecord.check_details.check_ids)) {
                      // Old format - create locations from check_ids and center coordinates
                      locations = selectedRecord.check_details.check_ids.map((checkId: string, i: number) => ({
                        id: i + 1,
                        lat: selectedRecord.center_lat || 0,
                        lng: selectedRecord.center_lon || 0,
                        expeditor: selectedRecord.check_details.expeditors?.[0] || selectedRecord.most_active_expiditor || 'Unknown',
                        time: 'Unknown Time',
                        status: 'Unknown',
                      }));
                    }
                    
                    return locations;
                  })()}
                  center={{ lat: selectedRecord.center_lat, lng: selectedRecord.center_lon }}
                      zoom={15}
                    />
                  </div>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

