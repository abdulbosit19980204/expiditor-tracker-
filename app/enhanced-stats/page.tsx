"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EnhancedStatisticsPanel } from "@/components/enhanced-statistics-panel"
import { 
  TrendingUp, 
  Download, 
  Filter, 
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Home,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  LogOut,
  User
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import type { Statistics, Project, Sklad, City, Filial } from "@/lib/types"
import { api } from "@/lib/api"

// Chart components (simplified for now)
const SimpleBarChart = ({ data, title }: { data: any[], title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{item.name || item.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (item.value / Math.max(...data.map(d => d.value))) * 100)}%` }}
                />
              </div>
              <Badge variant="outline">{item.value}</Badge>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const SimpleLineChart = ({ data, title }: { data: any[], title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <LineChart className="h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-end justify-between space-x-1">
        {data.slice(0, 7).map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="bg-blue-600 w-8 rounded-t"
              style={{ height: `${Math.max(20, (item.value / Math.max(...data.map(d => d.value))) * 200)}px` }}
            />
            <span className="text-xs mt-2 text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

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

function EnhancedStatsPageContent() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
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

  // Load statistics when filters change
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

    loadStatistics()
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
      [t('total_checks'), statistics.totalChecks],
      [t('delivered'), statistics.deliveredChecks],
      [t('failed'), statistics.failedChecks],
      [t('pending'), statistics.pendingChecks],
      [t('total_sum_uzs'), statistics.totalSum],
      [t('average_check_sum_uzs'), statistics.avgCheckSum || 0],
      [t('success_rate_percent'), statistics.successRate],
      ['', ''],
      [t('payment_methods'), ''],
      [t('cash'), statistics.paymentMethods.nalichniy],
      [t('uzcard'), statistics.paymentMethods.uzcard],
      [t('humo'), statistics.paymentMethods.humo],
      [t('click'), statistics.paymentMethods.click],
      ['', ''],
      [t('top_expeditors'), ''],
      ...statistics.topExpeditors.map(exp => [exp.name, exp.checkCount]),
      ['', ''],
      [t('top_projects'), ''],
      ...statistics.topProjects.map(proj => [proj.name, proj.checkCount]),
      ['', ''],
      [t('top_cities'), ''],
      ...statistics.topCities.map(city => [city.name, city.checkCount]),
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `enhanced_statistics_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [statistics])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600">Loading enhanced statistics...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              {t('enhanced_analytics_dashboard')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('comprehensive_statistics_insights')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* User Profile */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm px-3 py-2 border rounded-md hover:bg-gray-50"
            >
              <Home className="h-4 w-4" /> Home
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
            <Button variant="outline" onClick={handleExportAll} disabled={!statistics}>
              <Download className="h-4 w-4 mr-1" /> {t('export_all')}
            </Button>
            <Button variant="outline" onClick={logout} title={t('logout')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('advanced_filters')}
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                <DatePickerWithRange
                  dateRange={filters.dateRange}
                  onDateRangeChange={(range) => handleFilterChange("dateRange", range || getCurrentMonthRange())}
                />
              </div>

              {/* Project Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{t('project')}</label>
                <Select
                  value={filters.project || "all"}
                  onValueChange={(value) => handleFilterChange("project", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">{t('warehouse')}</label>
                <Select
                  value={filters.sklad || "all"}
                  onValueChange={(value) => handleFilterChange("sklad", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All warehouses</SelectItem>
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">{t('city')}</label>
                <Select
                  value={filters.city || "all"}
                  onValueChange={(value) => handleFilterChange("city", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cities</SelectItem>
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">{t('filial')}</label>
                <Select
                  value={filters.filial || "all"}
                  onValueChange={(value) => handleFilterChange("filial", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All filials" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All filials</SelectItem>
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">{t('status')}</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={clearAllFilters}>
                  {t('clear_all_filters')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Statistics Panel */}
        {statistics && (
          <EnhancedStatisticsPanel statistics={statistics} isLoading={isRefreshing} />
        )}

        {/* Charts Grid */}
        {statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Statistics */}
            {visibleCharts.dailyStats && (
              <SimpleLineChart 
                data={statistics.dailyStats.map(d => ({ label: new Date(d.date).toLocaleDateString(), value: d.checks }))}
                title={t('daily_check_distribution')}
              />
            )}

            {/* Top Expeditors */}
            {visibleCharts.topExpeditors && (
              <SimpleBarChart 
                data={statistics.topExpeditors.map(exp => ({ name: exp.name, value: exp.checkCount }))}
                title={t('top_expeditors_by_check_count')}
              />
            )}

            {/* Top Projects */}
            {visibleCharts.topProjects && (
              <SimpleBarChart 
                data={statistics.topProjects.map(proj => ({ name: proj.name, value: proj.checkCount }))}
                title={t('top_projects_by_check_count')}
              />
            )}

            {/* Top Cities */}
            {visibleCharts.topCities && (
              <SimpleBarChart 
                data={statistics.topCities.map(city => ({ name: city.name, value: city.checkCount }))}
                title={t('top_cities_by_check_count')}
              />
            )}
          </div>
        )}

        {/* Chart Visibility Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('chart_visibility_settings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(visibleCharts).map(([chart, isVisible]) => (
                <Button
                  key={chart}
                  variant={isVisible ? "default" : "outline"}
                  onClick={() => toggleChartVisibility(chart as keyof typeof visibleCharts)}
                  className="justify-start"
                >
                  {isVisible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {t(chart.replace(/([A-Z])/g, '_$1').toLowerCase())}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function EnhancedStatsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="py-20 flex items-center justify-center">
              <LoadingSpinner size="lg" />
              <span className="ml-2 text-gray-600">Loading enhanced statistics page...</span>
            </div>
          </div>
        </div>
      }>
        <EnhancedStatsPageContent />
      </Suspense>
    </AuthGuard>
  )
}
