"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "../../lib/simple-i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { HelpModal } from "@/components/help-modal"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  Legend, ComposedChart, Scatter, ScatterChart, ZAxis
} from "recharts"
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { api } from "@/lib/api"
import { DateRange } from "react-day-picker"

interface DashboardStats {
  totalChecks: number
  totalRevenue: number
  deliveredChecks: number
  failedChecks: number
  pendingChecks: number
  successRate: number
  avgCheckValue: number
  uniqueExpeditors: number
}

interface DailySalesData {
  date: string
  total_checks: number
  total_revenue: number
  delivered_checks: number
  failed_checks: number
  pending_checks: number
}

interface ExpeditorPerformance {
  ekispiditor: string
  total_checks: number
  delivered_checks: number
  failed_checks: number
  pending_checks: number
  success_rate: number
  total_revenue: number
}

interface PaymentDistribution {
  method: string
  amount: number
  percentage: number
}

interface ProjectStats {
  project: string
  total_checks: number
  delivered_checks: number
  failed_checks: number
  pending_checks: number
  unique_expeditors: number
  total_revenue: number
}

interface StatusDistribution {
  status: string
  count: number
  percentage: number
}

interface LocationStats {
  city_statistics: Array<{
    city: string
    total_checks: number
    total_revenue: number
    unique_expeditors: number
  }>
  sklad_statistics: Array<{
    sklad: string
    total_checks: number
    total_revenue: number
    unique_expeditors: number
  }>
  filial_statistics: Array<{
    ekispiditor__filial__filial_name: string
    total_checks: number
    total_revenue: number
    unique_expeditors: number
  }>
}

interface HourlyDistribution {
  hour: string
  checks_count: number
  delivered_count: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function StatisticsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([])
  const [expeditorPerformance, setExpeditorPerformance] = useState<ExpeditorPerformance[]>([])
  const [paymentDistribution, setPaymentDistribution] = useState<PaymentDistribution[]>([])
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([])
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null)
  const [hourlyDistribution, setHourlyDistribution] = useState<HourlyDistribution[]>([])

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    
    if (dateRange?.from) {
      params.append('date_from', dateRange.from.toISOString())
    }
    if (dateRange?.to) {
      params.append('date_to', dateRange.to.toISOString())
    }
    
    return params.toString()
  }, [dateRange])

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setRefreshing(true)
      const queryParams = buildQueryParams()
      
      // Fetch all data in parallel
      const [
        revenueResponse,
        dailySalesResponse,
        expeditorResponse,
        paymentResponse,
        projectResponse,
        statusResponse,
        locationResponse,
        hourlyResponse
      ] = await Promise.all([
        fetch(`/api/statistics/revenue-summary/?${queryParams}`),
        fetch(`/api/statistics/daily-sales/?${queryParams}`),
        fetch(`/api/statistics/expeditor-performance/?${queryParams}&limit=10`),
        fetch(`/api/statistics/payment-distribution/?${queryParams}`),
        fetch(`/api/statistics/project-statistics/?${queryParams}&limit=10`),
        fetch(`/api/statistics/status-distribution/?${queryParams}`),
        fetch(`/api/statistics/location-statistics/?${queryParams}`),
        fetch(`/api/statistics/hourly-distribution/?${queryParams}`)
      ])

      // Parse responses
      const [revenueData, dailySalesData, expeditorData, paymentData, projectData, statusData, locationData, hourlyData] = await Promise.all([
        revenueResponse.json(),
        dailySalesResponse.json(),
        expeditorResponse.json(),
        paymentResponse.json(),
        projectResponse.json(),
        statusResponse.json(),
        locationResponse.json(),
        hourlyResponse.json()
      ])

      // Set dashboard stats from revenue data
      if (revenueData.basic_statistics && revenueData.revenue_statistics) {
        const basic = revenueData.basic_statistics
        const revenue = revenueData.revenue_statistics
        const metrics = revenueData.performance_metrics

        setDashboardStats({
          totalChecks: basic.total_checks || 0,
          totalRevenue: revenue.total_revenue || 0,
          deliveredChecks: basic.delivered_checks || 0,
          failedChecks: basic.failed_checks || 0,
          pendingChecks: basic.pending_checks || 0,
          successRate: metrics.success_rate || 0,
          avgCheckValue: metrics.avg_revenue_per_check || 0,
          uniqueExpeditors: basic.unique_expeditors || 0
        })
      }

      // Set other data
      setDailySalesData(dailySalesData.daily_data || [])
      setExpeditorPerformance(expeditorData.expeditor_performance || [])
      setPaymentDistribution(paymentData.payment_distribution || [])
      setProjectStats(projectData.project_statistics || [])
      setStatusDistribution(statusData.status_distribution || [])
      setLocationStats(locationData)
      setHourlyDistribution(hourlyData.hourly_distribution || [])

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [buildQueryParams])

  // Initial load
  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Export data handler
  const handleExport = useCallback(() => {
    // Implementation for data export
    console.log('Export functionality to be implemented')
  }, [])

  // Memoized chart data
  const chartData = useMemo(() => {
    return {
      dailySales: dailySalesData.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        checks: item.total_checks,
        revenue: item.total_revenue,
        delivered: item.delivered_checks,
        failed: item.failed_checks,
        pending: item.pending_checks
      })),
      
      expeditorPerformance: expeditorPerformance.slice(0, 8).map(item => ({
        name: item.ekispiditor.length > 15 ? item.ekispiditor.substring(0, 15) + '...' : item.ekispiditor,
        fullName: item.ekispiditor,
        checks: item.total_checks,
        revenue: item.total_revenue,
        successRate: item.success_rate
      })),
      
      paymentDistribution: paymentDistribution.map(item => ({
        name: item.method,
        value: item.amount,
        percentage: item.percentage
      })),
      
      projectStats: projectStats.slice(0, 6).map(item => ({
        name: item.project.length > 12 ? item.project.substring(0, 12) + '...' : item.project,
        fullName: item.project,
        checks: item.total_checks,
        revenue: item.total_revenue
      })),
      
      statusDistribution: statusDistribution.map(item => ({
        name: item.status,
        value: item.count,
        percentage: item.percentage,
        color: item.status === 'delivered' ? '#00C49F' : 
               item.status === 'failed' ? '#FF8042' : '#FFBB28'
      })),
      
      hourlyDistribution: hourlyDistribution.map(item => ({
        hour: new Date(item.hour).getHours() + ':00',
        checks: item.checks_count,
        delivered: item.delivered_count
      }))
    }
  }, [dailySalesData, expeditorPerformance, paymentDistribution, projectStats, statusDistribution, hourlyDistribution])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            {t("analyticsDashboard")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t("comprehensiveAnalytics")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpModal />
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t("refresh")}
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[300px]">
              <label className="text-sm font-medium mb-2 block">{t("dateRange")}</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("totalChecks")}</p>
                <p className="text-2xl font-bold">{dashboardStats?.totalChecks.toLocaleString() || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("totalRevenue")}</p>
                <p className="text-2xl font-bold">{(dashboardStats?.totalRevenue || 0).toLocaleString()} UZS</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("successRate")}</p>
                <p className="text-2xl font-bold">{dashboardStats?.successRate.toFixed(1) || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("avgCheckValue")}</p>
                <p className="text-2xl font-bold">{(dashboardStats?.avgCheckValue || 0).toLocaleString()} UZS</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("dailyCheckDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="checks" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="delivered" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              {t("paymentMethodsDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.paymentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.paymentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Expeditors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("topExpeditors")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.expeditorPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="checks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t("statusDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("topProjects")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.projectStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="checks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("hourlyDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="checks" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="delivered" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location Statistics */}
      {locationStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("topCities")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locationStats.city_statistics.slice(0, 5).map((city, index) => (
                  <div key={city.city} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{city.city}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {city.total_checks} {t("checks")} • {city.unique_expeditors} {t("expeditors")}
                      </p>
                    </div>
                    <Badge variant="outline">{(city.total_revenue || 0).toLocaleString()} UZS</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Warehouses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("warehouseDistribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locationStats.sklad_statistics.slice(0, 5).map((sklad, index) => (
                  <div key={sklad.sklad} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{sklad.sklad}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {sklad.total_checks} {t("checks")} • {sklad.unique_expeditors} {t("expeditors")}
                      </p>
                    </div>
                    <Badge variant="outline">{(sklad.total_revenue || 0).toLocaleString()} UZS</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("filialPerformance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locationStats.filial_statistics.slice(0, 5).map((filial, index) => (
                  <div key={filial.ekispiditor__filial__filial_name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{filial.ekispiditor__filial__filial_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {filial.total_checks} {t("checks")} • {filial.unique_expeditors} {t("expeditors")}
                      </p>
                    </div>
                    <Badge variant="outline">{(filial.total_revenue || 0).toLocaleString()} UZS</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
