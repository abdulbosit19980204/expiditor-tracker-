"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Home, TrendingUp, Download, Search, BarChart3, PieChart, Activity, Users, DollarSign, Calendar, Filter, RefreshCw, Eye, EyeOff } from "lucide-react"
import type { Statistics, Project, Sklad, City } from "@/lib/types"
import { api } from "@/lib/api"
import { useState, useCallback, useEffect, useMemo } from "react"
import Link from "next/link"
import { Suspense } from "react"

function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: firstDay, to: lastDay }
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Enhanced CSV Export function
const exportToCSV = (stats: Statistics, filters: any) => {
  const csvData = [
    ['Metric', 'Value'],
    ['Total Checks', stats.totalChecks],
    ['Delivered Checks', stats.deliveredChecks],
    ['Failed Checks', stats.failedChecks],
    ['Pending Checks', stats.pendingChecks],
    ['Total Sum (UZS)', stats.totalSum],
    ['Average Check Sum (UZS)', stats.avgCheckSum || 0],
    ['Success Rate (%)', stats.successRate],
    ['', ''],
    ['Payment Methods', ''],
    ['Cash', stats.paymentMethods.nalichniy],
    ['UzCard', stats.paymentMethods.uzcard],
    ['Humo', stats.paymentMethods.humo],
    ['Click', stats.paymentMethods.click],
    ['', ''],
    ['Top Expeditors', ''],
    ...stats.topExpeditors.map(exp => [exp.name, exp.checkCount]),
    ['', ''],
    ['Top Projects', ''],
    ...stats.topProjects.map(proj => [proj.name, proj.checkCount]),
    ['', ''],
    ['Top Cities', ''],
    ...stats.topCities.map(city => [city.name, city.checkCount]),
    ['', ''],
    ['Top Warehouses', ''],
    ...(stats.topSklads || []).map(sklad => [sklad.name, sklad.checkCount]),
    ['', ''],
    ['Daily Statistics', ''],
    ...(stats.dailyStats || []).map(day => [day.date, day.checks]),
    ['', ''],
    ['Hourly Statistics', ''],
    ...(stats.hourlyStats || []).map(hour => [hour.hour, hour.checks]),
    ['', ''],
    ['Weekday Statistics', ''],
    ...(stats.dowStats || []).map(dow => [dowLabel(dow.dow), dow.checks]),
  ]

  const csvContent = csvData.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `statistics_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const StatsPageContent = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(getCurrentMonthRange())
  const [project, setProject] = useState("")
  const [sklad, setSklad] = useState("")
  const [city, setCity] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Statistics | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar')

  // Debounced filters for better performance
  const debouncedProject = useDebounce(project, 300)
  const debouncedSklad = useDebounce(sklad, 300)
  const debouncedCity = useDebounce(city, 300)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const filters = { dateRange, project: debouncedProject, sklad: debouncedSklad, city: debouncedCity, status }
      const data = await api.getGlobalStatistics(filters)
      setStats(data)
    } catch (e) {
      console.error('Error loading statistics:', e)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [dateRange, debouncedProject, debouncedSklad, debouncedCity, status])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [proj, skl, cts] = await Promise.all([api.getProjects(), api.getSklads(), api.getCities()])
        setProjects(proj)
        setSklads(skl)
        setCities(cts)
      } catch (error) {
        console.error('Error loading metadata:', error)
      }
    }
    loadMeta()
  }, [])

  const formatNumber = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n || 0))
  const formatCurrency = (n: number) => `${formatNumber(n)} UZS`

  const handleResetFilters = () => {
    setProject("")
    setSklad("")
    setCity("")
    setStatus("")
    setDateRange(getCurrentMonthRange())
  }

  const handleExport = () => {
    if (stats) {
      exportToCSV(stats, { dateRange, project, sklad, city, status })
    }
  }

  const activeFiltersCount = [project, sklad, city, status].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              Global Statistics
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive analytics dashboard for expeditor operations</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" /> Home
            </Link>
            <Button variant="outline" onClick={loadStats} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!stats} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                  <DatePickerWithRange
                    dateRange={dateRange}
                    onDateRangeChange={(r) => setDateRange(r || getCurrentMonthRange())}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Project</label>
                  <Select value={project} onValueChange={setProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All projects</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.project_name}>
                          {p.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Warehouse</label>
                  <Select value={sklad} onValueChange={setSklad}>
                    <SelectTrigger>
                      <SelectValue placeholder="All warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All warehouses</SelectItem>
                      {sklads.map((s) => (
                        <SelectItem key={s.id} value={s.sklad_name}>
                          {s.sklad_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All cities</SelectItem>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.city_name}>
                          {c.city_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <Button onClick={handleResetFilters} variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Reset All Filters
                </Button>
              )}
            </CardContent>
          )}
        </Card>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading statistics...</p>
            </div>
          </div>
        ) : !stats ? (
          <Card className="py-20">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No statistics available</p>
              <p className="text-sm mt-2">Try adjusting your filters or date range</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Checks</p>
                      <p className="text-3xl font-bold text-blue-900">{formatNumber(stats.totalChecks)}</p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <Activity className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Delivered</p>
                      <p className="text-3xl font-bold text-green-900">{formatNumber(stats.deliveredChecks)}</p>
                      <p className="text-xs text-green-600 mt-1">{stats.successRate.toFixed(1)}% success rate</p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-purple-900">{formatCurrency(stats.totalSum)}</p>
                    </div>
                    <div className="p-3 bg-purple-200 rounded-full">
                      <DollarSign className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Avg Check Value</p>
                      <p className="text-3xl font-bold text-orange-900">{formatCurrency(stats.avgCheckSum || 0)}</p>
                    </div>
                    <div className="p-3 bg-orange-200 rounded-full">
                      <Calendar className="h-6 w-6 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Distribution */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Daily Check Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedBarChart
                    data={(stats.dailyStats || []).map((d) => ({ 
                      label: new Date(d.date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }), 
                      value: d.checks 
                    }))}
                    height={200}
                    color="#3b82f6"
                  />
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethodsChart paymentMethods={stats.paymentMethods} />
                </CardContent>
              </Card>

              {/* Hourly Distribution */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Hourly Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedLineChart
                    data={(stats.hourlyStats || []).map((h) => ({ 
                      x: new Date(h.hour).getHours(), 
                      y: h.checks 
                    }))}
                    height={200}
                  />
                </CardContent>
              </Card>

              {/* Weekday Distribution */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekday Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedBarChart
                    data={(stats.dowStats || []).map((d) => ({ 
                      label: dowLabel(d.dow), 
                      value: d.checks 
                    }))}
                    height={200}
                    color="#10b981"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Expeditors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopPerformersList
                    items={(stats.topExpeditors || []).map((exp) => ({ 
                      name: exp.name, 
                      value: exp.checkCount,
                      secondary: formatCurrency(exp.totalSum)
                    }))}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopPerformersList
                    items={(stats.topProjects || []).map((proj) => ({ 
                      name: proj.name, 
                      value: proj.checkCount,
                      secondary: formatCurrency(proj.totalSum)
                    }))}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Top Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopPerformersList
                    items={(stats.topCities || []).map((city) => ({ 
                      name: city.name, 
                      value: city.checkCount,
                      secondary: formatCurrency(city.totalSum)
                    }))}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Chart Components
function EnhancedBarChart({ data, height = 200, color = "#3b82f6" }: { 
  data: { label: string; value: number }[]; 
  height?: number; 
  color?: string 
}) {
  const max = Math.max(1, ...data.map((d) => d.value || 0))
  
  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} className="bg-white">
        {data.map((d, i) => {
          const barWidth = 100 / Math.max(1, data.length)
          const x = i * barWidth + barWidth * 0.1
          const barHeight = (d.value / max) * (height - 40)
          const y = height - 30 - barHeight
          
          return (
            <g key={i}>
              <rect 
                x={x} 
                y={y} 
                width={barWidth * 0.8} 
                height={barHeight} 
                fill={color} 
                opacity={0.8}
                rx={2}
                className="hover:opacity-100 transition-opacity"
              />
              <text 
                x={x + barWidth * 0.4} 
                y={height - 10} 
                fontSize="3" 
                textAnchor="middle" 
                fill="#6b7280"
                className="font-medium"
              >
                {d.label}
              </text>
              <text 
                x={x + barWidth * 0.4} 
                y={y - 5} 
                fontSize="2.5" 
                textAnchor="middle" 
                fill="#374151"
                className="font-semibold"
              >
                {d.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function EnhancedLineChart({ data, height = 200 }: { 
  data: { x: number; y: number }[]; 
  height?: number 
}) {
  if (!data.length) return <div className="text-sm text-gray-500 text-center py-8">No data available</div>
  
  const xs = data.map((d) => d.x)
  const ys = data.map((d) => d.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = 0
  const maxY = Math.max(1, ...ys)
  
  const normalize = (x: number, y: number) => ({
    nx: ((x - minX) / Math.max(1, maxX - minX)) * 100,
    ny: (1 - (y - minY) / Math.max(1, maxY - minY)) * (height - 40) + 20,
  })
  
  const points = data
    .sort((a, b) => a.x - b.x)
    .map((p) => {
      const { nx, ny } = normalize(p.x, p.y)
      return `${nx},${ny}`
    })
    .join(" ")
  
  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} className="bg-white">
        <polyline 
          points={points} 
          fill="none" 
          stroke="#10b981" 
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((p, i) => {
          const { nx, ny } = normalize(p.x, p.y)
          return (
            <circle
              key={i}
              cx={nx}
              cy={ny}
              r={2}
              fill="#10b981"
              className="hover:r-3 transition-all"
            />
          )
        })}
      </svg>
    </div>
  )
}

function PaymentMethodsChart({ paymentMethods }: { paymentMethods: any }) {
  const total = Object.values(paymentMethods).reduce((sum: number, amount: any) => sum + amount, 0)
  const methods = [
    { name: 'Cash', value: paymentMethods.nalichniy, color: '#10b981' },
    { name: 'UzCard', value: paymentMethods.uzcard, color: '#3b82f6' },
    { name: 'Humo', value: paymentMethods.humo, color: '#8b5cf6' },
    { name: 'Click', value: paymentMethods.click, color: '#f59e0b' },
  ].filter(m => m.value > 0)

  return (
    <div className="space-y-4">
      {methods.map((method, i) => {
        const percentage = total > 0 ? (method.value / total) * 100 : 0
        return (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{method.name}</span>
              <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: method.color 
                }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {new Intl.NumberFormat("uz-UZ").format(method.value)} UZS
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TopPerformersList({ items }: { items: { name: string; value: number; secondary?: string }[] }) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">No data available</div>
      ) : (
        items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-sm">{item.name || "Unknown"}</p>
                {item.secondary && (
                  <p className="text-xs text-gray-500">{item.secondary}</p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="font-semibold">
              {item.value}
            </Badge>
          </div>
        ))
      )}
    </div>
  )
}

function dowLabel(dow: number) {
  const map: Record<number, string> = { 
    1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" 
  }
  return map[dow] || String(dow)
}

export default function StatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-20 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading statistics page...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <StatsPageContent />
    </Suspense>
  )
}
