"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { LoadingSpinner } from "@/components/loading-spinner"
import { 
  TrendingUp, 
  Download, 
  Filter, 
  BarChart3,
  PieChart,
  LineChart,
  Home,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  DollarSign,
  Users,
  Package,
  MapPin,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import type { Statistics, Project, Sklad, City, Filial } from "@/lib/types"
import { api } from "@/lib/api"
import { 
  Bar, 
  BarChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts"

// Custom tooltip component for better UX
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Chart color palette for consistent theming
const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981", 
  accent: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6"
}

const COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.danger,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.indigo,
  CHART_COLORS.teal
]

function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: firstDay, to: lastDay }
}

interface FilterState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  project: string
  sklad: string
  city: string
  filial: string
  status: string
}

function AnalyticsPageContent() {
  const { t } = useTranslation()
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filials, setFilials] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>(() => ({
    dateRange: getCurrentMonthRange(),
    project: "",
    sklad: "",
    city: "",
    filial: "",
    status: "",
  }))

  // View preferences
  const [visibleCharts, setVisibleCharts] = useState({
    dailyStats: true,
    hourlyStats: true,
    topExpeditors: true,
    topProjects: true,
    topCities: true,
    paymentMethods: true,
    warehouseDistribution: true,
  })

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [projectsData, skladsData, citiesData, filialsData] = await Promise.all([
          api.getProjects(),
          api.getSklads(),
          api.getCities(),
          api.getFilials(),
        ])

        setProjects(projectsData)
        setSklads(skladsData)
        setCities(citiesData)
        setFilials(filialsData)
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load statistics when filters change (with debouncing)
  useEffect(() => {
    const loadStatistics = async () => {
      setIsRefreshing(true)
      try {
        const backendFilters = {
          dateRange: filters.dateRange,
          project: filters.project,
          sklad: filters.sklad,
          city: filters.city,
          status: filters.status,
        }

        const statisticsData = await api.getGlobalStatistics(backendFilters)
        setStatistics(statisticsData)
      } catch (error) {
        console.error("Error loading statistics:", error)
        setStatistics(null)
      } finally {
        setIsRefreshing(false)
      }
    }

    // Debounce the API call to prevent too many requests
    const timeoutId = setTimeout(loadStatistics, 300)
    return () => clearTimeout(timeoutId)
  }, [filters])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.project) count++
    if (filters.sklad) count++
    if (filters.city) count++
    if (filters.filial) count++
    if (filters.status) count++
    return count
  }, [filters])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      dateRange: getCurrentMonthRange(),
      project: "",
      sklad: "",
      city: "",
      filial: "",
      status: "",
    })
  }, [])

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Toggle chart visibility
  const toggleChartVisibility = useCallback((chart: keyof typeof visibleCharts) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chart]: !prev[chart]
    }))
  }, [])

  // Export all data
  const handleExportAll = useCallback(() => {
    if (!statistics) return

    const csvData = [
      ['Metric', 'Value'],
      [t('totalChecks'), statistics.totalChecks],
      [t('delivered'), statistics.deliveredChecks],
      [t('failed'), statistics.failedChecks],
      [t('awaitingDelivery'), statistics.pendingChecks],
      [t('totalSum') + ' (UZS)', statistics.totalSum],
      [t('avgCheckSum') + ' (UZS)', statistics.avgCheckSum || 0],
      [t('deliverySuccessRate') + ' (%)', statistics.successRate],
      ['', ''],
      [t('paymentMethods'), ''],
      [t('cash'), statistics.paymentMethods.nalichniy],
      [t('uzcard'), statistics.paymentMethods.uzcard],
      [t('humo'), statistics.paymentMethods.humo],
      [t('click'), statistics.paymentMethods.click],
      ['', ''],
      [t('topExpeditors'), ''],
      ...statistics.topExpeditors.map(exp => [exp.name, exp.checkCount]),
      ['', ''],
      [t('topProjects'), ''],
      ...statistics.topProjects.map(proj => [proj.name, proj.checkCount]),
      ['', ''],
      [t('topCities'), ''],
      ...statistics.topCities.map(city => [city.name, city.checkCount]),
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [statistics, t])

  // Format numbers with locale
  const formatNumber = useCallback((n: number) => {
    return new Intl.NumberFormat("uz-UZ").format(Math.round(n || 0))
  }, [])

  // Format currency
  const formatCurrency = useCallback((n: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(Math.round(n || 0))
  }, [])

  // Memoized chart data
  const dailyChartData = useMemo(() => {
    if (!statistics?.dailyStats) return []
    return statistics.dailyStats.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      checks: d.checks,
      sum: d.checks * (statistics.avgCheckSum || 0) // Approximate sum
    }))
  }, [statistics?.dailyStats, statistics?.avgCheckSum])

  const hourlyChartData = useMemo(() => {
    if (!statistics?.hourlyStats) return []
    return statistics.hourlyStats.map(h => ({
      hour: `${h.hour}:00`,
      checks: h.checks
    }))
  }, [statistics?.hourlyStats])

  const paymentChartData = useMemo(() => {
    if (!statistics?.paymentMethods) return []
    return [
      { name: t('cash'), value: statistics.paymentMethods.nalichniy, color: COLORS[0] },
      { name: t('uzcard'), value: statistics.paymentMethods.uzcard, color: COLORS[1] },
      { name: t('humo'), value: statistics.paymentMethods.humo, color: COLORS[2] },
      { name: t('click'), value: statistics.paymentMethods.click, color: COLORS[3] },
    ].filter(item => item.value > 0)
  }, [statistics?.paymentMethods, t])

  const expeditorChartData = useMemo(() => {
    if (!statistics?.topExpeditors) return []
    return statistics.topExpeditors.slice(0, 10).map(exp => ({
      name: exp.name,
      checks: exp.checkCount,
      sum: exp.totalSum
    }))
  }, [statistics?.topExpeditors])

  const projectChartData = useMemo(() => {
    if (!statistics?.topProjects) return []
    return statistics.topProjects.slice(0, 8).map(proj => ({
      name: proj.name,
      checks: proj.checkCount,
      sum: proj.totalSum
    }))
  }, [statistics?.topProjects])

  const cityChartData = useMemo(() => {
    if (!statistics?.topCities) return []
    return statistics.topCities.slice(0, 8).map(city => ({
      name: city.name,
      checks: city.checkCount,
      sum: city.totalSum
    }))
  }, [statistics?.topCities])

  const warehouseChartData = useMemo(() => {
    if (!statistics?.topSklads) return []
    return statistics.topSklads.slice(0, 8).map(sklad => ({
      name: sklad.name,
      checks: sklad.checkCount,
      sum: sklad.totalSum
    }))
  }, [statistics?.topSklads])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">{t('loadingStatistics')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              {t('analyticsDashboard')}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {t('comprehensiveAnalytics')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Home className="h-4 w-4" />
              {t('home')}
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
            <Button variant="outline" onClick={handleExportAll} disabled={!statistics} className="gap-2">
              <Download className="h-4 w-4" />
              {t('exportData')}
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">
                  {t('totalChecks')}
                </CardTitle>
                <Package className="h-4 w-4 text-blue-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistics.totalChecks)}</div>
                <p className="text-xs text-blue-200">
                  {t('allExpeditorChecks')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">
                  {t('totalSum')}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalSum)}</div>
                <p className="text-xs text-green-200">
                  {t('totalCheckValue')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">
                  {t('avgCheckSum')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.avgCheckSum || 0)}</div>
                <p className="text-xs text-purple-200">
                  {t('perCheckAverage')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">
                  {t('deliverySuccessRate')}
                </CardTitle>
                <Activity className="h-4 w-4 text-orange-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</div>
                <p className="text-xs text-orange-200">
                  {t('successfulDeliveries')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('advancedFilters')}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} {t('active')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Date Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('dateRange')}
                </label>
                <DatePickerWithRange
                  dateRange={filters.dateRange}
                  onDateRangeChange={(range) => handleFilterChange("dateRange", range || getCurrentMonthRange())}
                />
              </div>

              {/* Project Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('project')}
                </label>
                <Select
                  value={filters.project || "all"}
                  onValueChange={(value) => handleFilterChange("project", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allProjects')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allProjects')}</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.project_name}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Warehouse Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('warehouse')}
                </label>
                <Select
                  value={filters.sklad || "all"}
                  onValueChange={(value) => handleFilterChange("sklad", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allWarehouses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allWarehouses')}</SelectItem>
                    {sklads.map((sklad) => (
                      <SelectItem key={sklad.id} value={sklad.sklad_name}>
                        {sklad.sklad_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('city')}
                </label>
                <Select
                  value={filters.city || "all"}
                  onValueChange={(value) => handleFilterChange("city", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allCities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCities')}</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.city_name}>
                        {city.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filial Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('filial')}
                </label>
                <Select
                  value={filters.filial || "all"}
                  onValueChange={(value) => handleFilterChange("filial", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allFilials')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allFilials')}</SelectItem>
                    {filials.map((filial) => (
                      <SelectItem key={filial.id} value={String(filial.id)}>
                        {filial.filial_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('status')}
                </label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="delivered">{t('delivered')}</SelectItem>
                    <SelectItem value="pending">{t('awaitingDelivery')}</SelectItem>
                    <SelectItem value="failed">{t('failed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={clearAllFilters}>
                  {t('clearAllFilters')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Grid */}
        {statistics && (
          <div className="space-y-6">
            {/* Daily Statistics */}
            {visibleCharts.dailyStats && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    {t('dailyCheckDistribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="checks" 
                        stroke={CHART_COLORS.primary} 
                        fill={CHART_COLORS.primary}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods Distribution */}
            {visibleCharts.paymentMethods && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      {t('paymentMethodsDistribution')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={paymentChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(value as number)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Hourly Distribution */}
                {visibleCharts.hourlyStats && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {t('hourlyDistribution')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="checks" fill={CHART_COLORS.secondary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Top Expeditors */}
            {visibleCharts.topExpeditors && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('topExpeditors')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={expeditorChartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="checks" fill={CHART_COLORS.accent} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Projects and Cities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visibleCharts.topProjects && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {t('topProjects')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projectChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="checks" fill={CHART_COLORS.purple} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {visibleCharts.topCities && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {t('topCities')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="checks" fill={CHART_COLORS.pink} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Warehouse Distribution */}
            {visibleCharts.warehouseDistribution && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t('warehouseDistribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={warehouseChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="checks" fill={CHART_COLORS.indigo} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Chart Visibility Controls */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('chartVisibilitySettings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(visibleCharts).map(([chart, isVisible]) => (
                <Button
                  key={chart}
                  variant={isVisible ? "default" : "outline"}
                  onClick={() => toggleChartVisibility(chart as keyof typeof visibleCharts)}
                  className="justify-start"
                >
                  {isVisible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {chart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading analytics...</span>
          </div>
        </div>
      </div>
    }>
      <AnalyticsPageContent />
    </Suspense>
  )
}
