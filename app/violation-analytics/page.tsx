'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Zap
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

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
  radius_distribution: Array<{ range: string; count: number }>
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
  filters_applied: {
    date_from: string | null
    date_to: string | null
    expeditor: string | null
    min_radius: string | null
    max_radius: string | null
  }
}

export default function ViolationAnalyticsDashboard() {
  const { token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
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

  const fetchDashboardData = async () => {
    if (!token) return

    setLoading(true)
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

      if (!response.ok) throw new Error('Failed to fetch dashboard data')

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [token])

  const applyFilters = () => {
    fetchDashboardData()
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive violation pattern analysis</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-4 w-4 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="date"
              placeholder="Date From"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="date"
              placeholder="Date To"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="text"
              placeholder="Expeditor Name"
              value={filters.expeditor}
              onChange={(e) => setFilters({ ...filters, expeditor: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="number"
              placeholder="Min Radius (m)"
              value={filters.min_radius}
              onChange={(e) => setFilters({ ...filters, min_radius: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="number"
              placeholder="Max Radius (m)"
              value={filters.max_radius}
              onChange={(e) => setFilters({ ...filters, max_radius: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="outline">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Violations</p>
                <p className="text-3xl font-bold text-red-600">{data.overview.total_violations}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checks Involved</p>
                <p className="text-3xl font-bold text-blue-600">{data.overview.total_checks_involved}</p>
              </div>
              <Target className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Expeditors</p>
                <p className="text-3xl font-bold text-purple-600">{data.overview.unique_expeditors}</p>
              </div>
              <Users className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Radius</p>
                <p className="text-3xl font-bold text-orange-600">{Math.round(data.overview.avg_radius_meters)}m</p>
              </div>
              <MapPin className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="violators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="violators">Top Violators</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="time">Time Analysis</TabsTrigger>
          <TabsTrigger value="severity">Severity</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Top Violators Tab */}
        <TabsContent value="violators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Violators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.top_violators.map((violator, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-red-100 text-red-600' :
                        idx === 1 ? 'bg-orange-100 text-orange-600' :
                        idx === 2 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{violator.most_active_expiditor || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{violator.total_checks} checks involved</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{violator.violation_count}</p>
                      <p className="text-xs text-gray-500">violations</p>
                      <p className="text-xs text-gray-500 mt-1">Avg: {Math.round(violator.avg_radius)}m</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expeditor Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Expeditor Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Expeditor</th>
                      <th className="text-right py-2">Violations</th>
                      <th className="text-right py-2">Total Checks</th>
                      <th className="text-right py-2">Avg Checks/Violation</th>
                      <th className="text-right py-2">Avg Radius</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expeditor_performance.map((exp, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">{exp.most_active_expiditor || 'Unknown'}</td>
                        <td className="text-right py-2 font-semibold">{exp.violations}</td>
                        <td className="text-right py-2">{exp.total_checks}</td>
                        <td className="text-right py-2">{exp.avg_checks_per_violation?.toFixed(1) || 0}</td>
                        <td className="text-right py-2">{Math.round(exp.avg_radius || 0)}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geographic Hotspots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.geographic_hotspots.map((hotspot, idx) => (
                  <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <MapPin className="h-5 w-5 text-red-600" />
                      <Badge variant="destructive">{hotspot.violation_count} violations</Badge>
                    </div>
                    <p className="text-sm font-mono text-gray-600">
                      {hotspot.lat.toFixed(2)}, {hotspot.lng.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {hotspot.expeditor_count} expeditors
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Analysis Tab */}
        <TabsContent value="time" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.time_analysis.daily.map((day, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <p className="w-24 text-sm font-medium text-gray-700">{day.day}</p>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.max(10, (day.count / Math.max(...data.time_analysis.daily.map(d => d.count))) * 100)}%`
                          }}
                        >
                          <span className="text-xs font-bold text-white">{day.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hourly Pattern */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Hourly Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {data.time_analysis.hourly.slice(0, 24).map((hour, idx) => {
                    const maxHourly = Math.max(...data.time_analysis.hourly.map(h => h.count))
                    const height = Math.max(10, (hour.count / maxHourly) * 200)
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-purple-600 rounded-t hover:bg-purple-700 transition-colors relative group"
                          style={{ height: `${height}px` }}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="outline" className="text-xs">{hour.count}</Badge>
                          </div>
                        </div>
                        {idx % 3 === 0 && (
                          <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Severity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-red-900">Critical</p>
                        <p className="text-sm text-red-700">&gt; 1000m</p>
                      </div>
                      <p className="text-3xl font-bold text-red-600">{data.severity_analysis.breakdown.critical}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-orange-900">Warning</p>
                        <p className="text-sm text-orange-700">500-1000m</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">{data.severity_analysis.breakdown.warning}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-yellow-900">Minor</p>
                        <p className="text-sm text-yellow-700">&lt; 500m</p>
                      </div>
                      <p className="text-3xl font-bold text-yellow-600">{data.severity_analysis.breakdown.minor}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radius Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Radius Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.severity_analysis.radius_distribution.map((range, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <p className="w-24 text-sm font-medium text-gray-700">{range.range}</p>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                        <div
                          className={`h-8 rounded-full flex items-center justify-end pr-2 ${
                            idx === 0 ? 'bg-green-500' :
                            idx === 1 ? 'bg-yellow-500' :
                            idx === 2 ? 'bg-orange-500' :
                            idx === 3 ? 'bg-red-500' :
                            'bg-red-700'
                          }`}
                          style={{
                            width: `${Math.max(10, (range.count / Math.max(...data.severity_analysis.radius_distribution.map(r => r.count))) * 100)}%`
                          }}
                        >
                          <span className="text-sm font-bold text-white">{range.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                7-Day Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {data.trend_analysis.map((trend, idx) => {
                  const maxCount = Math.max(...data.trend_analysis.map(t => t.count))
                  const height = Math.max(20, (trend.count / maxCount) * 200)
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition-colors relative group"
                        style={{ height: `${height}px` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge className="text-xs whitespace-nowrap">
                            {trend.count} violations
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 mt-2 text-center">
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

      {/* Applied Filters Info */}
      {(filters.date_from || filters.date_to || filters.expeditor || filters.min_radius || filters.max_radius) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Active Filters:</span>
              {filters.date_from && <Badge variant="outline">From: {filters.date_from}</Badge>}
              {filters.date_to && <Badge variant="outline">To: {filters.date_to}</Badge>}
              {filters.expeditor && <Badge variant="outline">Expeditor: {filters.expeditor}</Badge>}
              {filters.min_radius && <Badge variant="outline">Min: {filters.min_radius}m</Badge>}
              {filters.max_radius && <Badge variant="outline">Max: {filters.max_radius}m</Badge>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
