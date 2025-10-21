'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  MapPin, 
  Clock, 
  Target,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Home,
  RefreshCw,
  Download,
  X,
  ChevronDown,
  Search,
  LogOut,
  User
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/loading-spinner'
import { toast } from '@/hooks/use-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7896/api'

interface OverviewStats {
  total_violations: number
  total_checks_involved: number
  unique_expeditors: number
  avg_radius_meters: number
}

interface TopViolator {
  most_active_expiditor: string
  violation_count: number
  total_checks: number
  avg_radius: number
  max_radius: number
  last_violation: string
}

interface GeographicHotspot {
  lat: number
  lng: number
  violation_count: number
  expeditor_count: number
}

interface TimeAnalysis {
  hourly: Array<{ hour: string; count: number }>
  daily: Array<{ day: string; count: number }>
}

interface SeverityAnalysis {
  breakdown: {
    critical: number
    warning: number
    minor: number
  }
  radius_distribution: Array<{
    range: string
    count: number
  }>
}

interface TrendData {
  date: string
  count: number
  total_checks: number
}

interface ExpeditorPerformance {
  most_active_expiditor: string
  violations: number
  total_checks: number
  avg_checks_per_violation: number
  avg_radius: number
}

interface DashboardData {
  overview: OverviewStats
  top_violators: TopViolator[]
  geographic_hotspots: GeographicHotspot[]
  time_analysis: TimeAnalysis
  severity_analysis: SeverityAnalysis
  trend_analysis: TrendData[]
  expeditor_performance: ExpeditorPerformance[]
}

export default function ViolationAnalyticsDashboard() {
  const { token, isLoading: authLoading, user, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    expeditor: '',
    min_radius: '',
    max_radius: '',
  })

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login')
    }
  }, [token, authLoading, router])

  const fetchDashboardData = async (isRefresh = false) => {
    if (!token) return

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const queryParams = new URLSearchParams()
      if (filters.date_from) queryParams.append('date_from', filters.date_from)
      if (filters.date_to) queryParams.append('date_to', filters.date_to)
      if (filters.expeditor) queryParams.append('expeditor', filters.expeditor)
      if (filters.min_radius) queryParams.append('min_radius', filters.min_radius)
      if (filters.max_radius) queryParams.append('max_radius', filters.max_radius)

      const response = await fetch(
        `${API_BASE_URL}/analytics/violation-dashboard/?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
      
      if (isRefresh) {
        toast({
          title: "Success",
          description: "Data refreshed successfully",
          variant: "default"
        })
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    }
  }, [token])

  const applyFilters = () => {
    fetchDashboardData()
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      expeditor: '',
      min_radius: '',
      max_radius: '',
    })
    setTimeout(() => fetchDashboardData(), 100)
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const handleExport = () => {
    if (!data) return
    
    const csvContent = `Violation Analytics Report
Generated: ${new Date().toLocaleString()}

Overview:
Total Violations,${data.overview.total_violations}
Total Checks,${data.overview.total_checks_involved}
Unique Expeditors,${data.overview.unique_expeditors}
Average Radius,${data.overview.avg_radius_meters}m

Top Violators:
Expeditor,Violations,Checks,Avg Radius
${data.top_violators.map(v => `${v.most_active_expiditor},${v.violation_count},${v.total_checks},${v.avg_radius}m`).join('\n')}
`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `violation-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Success",
      description: "Report exported successfully",
      variant: "default"
    })
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 text-lg font-medium">Loading analytics dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No analytics data available</p>
            <Button onClick={() => fetchDashboardData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Violation Analytics
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Real-time pattern detection and analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* User Profile */}
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user.first_name} {user.last_name}
                  </span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden md:flex"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="hidden md:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Home</span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filters Section */}
        <Card className="border-2 border-blue-100 shadow-md">
          <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters
                {(filters.date_from || filters.date_to || filters.expeditor || filters.min_radius || filters.max_radius) && (
                  <Badge variant="default" className="ml-2">Active</Badge>
                )}
              </CardTitle>
              <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
          
          {showFilters && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_from" className="text-sm font-medium">Date From</Label>
                  <Input
                    id="date_from"
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_to" className="text-sm font-medium">Date To</Label>
                  <Input
                    id="date_to"
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expeditor" className="text-sm font-medium">Expeditor</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="expeditor"
                      type="text"
                      placeholder="Search expeditor..."
                      value={filters.expeditor}
                      onChange={(e) => setFilters({ ...filters, expeditor: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_radius" className="text-sm font-medium">Min Radius (m)</Label>
                  <Input
                    id="min_radius"
                    type="number"
                    placeholder="0"
                    value={filters.min_radius}
                    onChange={(e) => setFilters({ ...filters, min_radius: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_radius" className="text-sm font-medium">Max Radius (m)</Label>
                  <Input
                    id="max_radius"
                    type="number"
                    placeholder="1000"
                    value={filters.max_radius}
                    onChange={(e) => setFilters({ ...filters, max_radius: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Total Violations</p>
                  <p className="text-4xl font-bold mt-2">{data.overview.total_violations.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <AlertTriangle className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Checks Involved</p>
                  <p className="text-4xl font-bold mt-2">{data.overview.total_checks_involved.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <Target className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Expeditors</p>
                  <p className="text-4xl font-bold mt-2">{data.overview.unique_expeditors}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Avg Radius</p>
                  <p className="text-4xl font-bold mt-2">{Math.round(data.overview.avg_radius_meters)}m</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <MapPin className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="violators" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-2 bg-white p-2 shadow-md">
            <TabsTrigger value="violators" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Top Violators</span>
              <span className="sm:hidden">Violators</span>
            </TabsTrigger>
            <TabsTrigger value="geography" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Geography</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Clock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Time</span>
              <span className="sm:hidden">Time</span>
            </TabsTrigger>
            <TabsTrigger value="severity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Severity</span>
              <span className="sm:hidden">Level</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Trends</span>
              <span className="sm:hidden">Trend</span>
            </TabsTrigger>
          </TabsList>

          {/* Top Violators Tab */}
          <TabsContent value="violators" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Violators List */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-red-600" />
                    Top 10 Violators
                  </CardTitle>
                  <CardDescription>Most frequent violation patterns</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {data.top_violators.slice(0, 10).map((violator, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md ${
                            idx === 0 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' :
                            idx === 1 ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' :
                            idx === 2 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white' :
                            'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {violator.most_active_expiditor || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {violator.total_checks} checks • Avg {Math.round(violator.avg_radius)}m
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-red-600">{violator.violation_count}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">violations</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expeditor Performance Table */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>Detailed expeditor statistics</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-2 font-semibold text-gray-700">Expeditor</th>
                          <th className="text-right py-3 px-2 font-semibold text-gray-700">Violations</th>
                          <th className="text-right py-3 px-2 font-semibold text-gray-700">Checks</th>
                          <th className="text-right py-3 px-2 font-semibold text-gray-700">Avg/V</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expeditor_performance.slice(0, 15).map((exp, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                            <td className="py-3 px-2 truncate max-w-[150px]" title={exp.most_active_expiditor}>
                              {exp.most_active_expiditor || 'Unknown'}
                            </td>
                            <td className="text-right py-3 px-2 font-semibold text-red-600">{exp.violations}</td>
                            <td className="text-right py-3 px-2">{exp.total_checks}</td>
                            <td className="text-right py-3 px-2 text-gray-600">
                              {exp.avg_checks_per_violation?.toFixed(1) || '0.0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geography Tab */}
          <TabsContent value="geography" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Geographic Hotspots
                </CardTitle>
                <CardDescription>Areas with highest violation density</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.geographic_hotspots.map((hotspot, idx) => (
                    <div 
                      key={idx} 
                      className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-red-500 p-2 rounded-lg shadow-md">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant="destructive" className="font-bold">
                          {hotspot.violation_count} violations
                        </Badge>
                      </div>
                      <p className="text-sm font-mono text-gray-700 font-medium mb-2">
                        📍 {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users className="h-3 w-3" />
                        <span>{hotspot.expeditor_count} expeditors</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Analysis Tab */}
          <TabsContent value="time" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Distribution */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Daily Distribution
                  </CardTitle>
                  <CardDescription>Violations by day of week</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {data.time_analysis.daily.map((day, idx) => {
                      const maxDaily = Math.max(...data.time_analysis.daily.map(d => d.count))
                      const percentage = (day.count / maxDaily) * 100
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{day.day}</span>
                            <span className="font-bold text-blue-600">{day.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(5, percentage)}%` }}
                            >
                              {percentage > 20 && (
                                <span className="text-xs font-bold text-white">{day.count}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Pattern */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Hourly Pattern
                  </CardTitle>
                  <CardDescription>Peak violation hours</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-64 flex items-end justify-between gap-1">
                    {data.time_analysis.hourly.slice(0, 24).map((hour, idx) => {
                      const maxHourly = Math.max(...data.time_analysis.hourly.map(h => h.count))
                      const height = Math.max(10, (hour.count / maxHourly) * 100)
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group">
                          <div className="relative w-full">
                            <div
                              className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg hover:from-purple-700 hover:to-purple-500 transition-all cursor-pointer shadow-md"
                              style={{ height: `${height * 2}px` }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap shadow-lg">
                                {hour.count} violations
                              </div>
                            </div>
                          </div>
                          {idx % 3 === 0 && (
                            <span className="text-xs text-gray-500 mt-2 font-medium">
                              {new Date(hour.hour).getHours()}h
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Severity Tab */}
          <TabsContent value="severity" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Severity Breakdown */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-red-50 to-yellow-50">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Severity Levels
                  </CardTitle>
                  <CardDescription>Categorized by violation radius</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="p-5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">Critical</p>
                        <p className="text-sm opacity-90">&gt; 1000 meters</p>
                      </div>
                      <p className="text-5xl font-bold">{data.severity_analysis.breakdown.critical}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">Warning</p>
                        <p className="text-sm opacity-90">500 - 1000 meters</p>
                      </div>
                      <p className="text-5xl font-bold">{data.severity_analysis.breakdown.warning}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">Minor</p>
                        <p className="text-sm opacity-90">&lt; 500 meters</p>
                      </div>
                      <p className="text-5xl font-bold">{data.severity_analysis.breakdown.minor}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Radius Distribution */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Radius Distribution
                  </CardTitle>
                  <CardDescription>Detailed breakdown by distance ranges</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {data.severity_analysis.radius_distribution.map((range, idx) => {
                      const maxRange = Math.max(...data.severity_analysis.radius_distribution.map(r => r.count))
                      const percentage = (range.count / maxRange) * 100
                      const colors = [
                        'from-green-500 to-green-600',
                        'from-yellow-500 to-yellow-600',
                        'from-orange-500 to-orange-600',
                        'from-red-500 to-red-600',
                        'from-red-600 to-red-700'
                      ]
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{range.range}</span>
                            <span className="font-bold text-gray-900">{range.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-10 overflow-hidden shadow-inner">
                            <div
                              className={`bg-gradient-to-r ${colors[idx] || colors[colors.length - 1]} h-10 rounded-full transition-all duration-500 flex items-center justify-end pr-3 shadow-md`}
                              style={{ width: `${Math.max(10, percentage)}%` }}
                            >
                              <span className="text-sm font-bold text-white">{range.count}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Daily Trend Analysis
                </CardTitle>
                <CardDescription>Violation trends over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-80 flex items-end justify-between gap-2">
                  {data.trend_analysis.map((trend, idx) => {
                    const maxCount = Math.max(...data.trend_analysis.map(t => t.count))
                    const height = Math.max(20, (trend.count / maxCount) * 100)
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group">
                        <div className="relative w-full">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer shadow-lg"
                            style={{ height: `${height * 3}px` }}
                          >
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl z-10">
                              <div>{trend.count} violations</div>
                              <div className="text-gray-300">{trend.total_checks} checks</div>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-3 text-center font-medium">
                          {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Active Filters Info */}
        {(filters.date_from || filters.date_to || filters.expeditor || filters.min_radius || filters.max_radius) && (
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-md">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex items-center gap-2 text-blue-900 font-semibold">
                  <Filter className="h-4 w-4" />
                  <span>Active Filters:</span>
                </div>
                {filters.date_from && (
                  <Badge variant="outline" className="bg-white">
                    From: {new Date(filters.date_from).toLocaleDateString()}
                  </Badge>
                )}
                {filters.date_to && (
                  <Badge variant="outline" className="bg-white">
                    To: {new Date(filters.date_to).toLocaleDateString()}
                  </Badge>
                )}
                {filters.expeditor && (
                  <Badge variant="outline" className="bg-white">
                    Expeditor: {filters.expeditor}
                  </Badge>
                )}
                {filters.min_radius && (
                  <Badge variant="outline" className="bg-white">
                    Min: {filters.min_radius}m
                  </Badge>
                )}
                {filters.max_radius && (
                  <Badge variant="outline" className="bg-white">
                    Max: {filters.max_radius}m
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
