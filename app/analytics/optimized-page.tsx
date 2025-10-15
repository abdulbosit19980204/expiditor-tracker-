"use client"

import React, { useState, useCallback, useMemo, Suspense, memo } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { 
  TrendingUp, 
  Download, 
  RefreshCw,
  Home,
  Settings,
  Eye,
  EyeOff
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "../../lib/simple-i18n"
import { useAnalyticsData } from "../../hooks/use-analytics-data"
import { useChartData } from "../../hooks/use-chart-data"
import MemoizedFilters from "../../components/analytics/memoized-filters"
import MemoizedMetricsCards from "../../components/analytics/memoized-metrics-cards"
import MemoizedChart from "../../components/analytics/memoized-chart"
import { 
  CustomTooltip, 
  ExpeditorTooltip, 
  PaymentTooltip 
} from "../../components/analytics/memoized-tooltips"
import { 
  LineChart,
  PieChart,
  Clock,
  Users,
  Package,
  MapPin
} from "lucide-react"

// Chart visibility state interface
interface ChartVisibility {
  dailyStats: boolean
  hourlyStats: boolean
  topExpeditors: boolean
  topProjects: boolean
  topCities: boolean
  paymentMethods: boolean
  warehouseDistribution: boolean
}

// Chart modes interface
interface ChartModes {
  dailyStats: 'count' | 'sum'
  hourlyStats: 'count' | 'sum'
  topExpeditors: 'count' | 'sum'
  topProjects: 'count' | 'sum'
  topCities: 'count' | 'sum'
  paymentMethods: 'count' | 'sum'
  warehouseDistribution: 'count' | 'sum'
}

// Optimized Analytics Page Content
const OptimizedAnalyticsPageContent = memo(() => {
  const { t } = useTranslation()
  
  // Use optimized data hook
  const {
    statistics,
    projects,
    sklads,
    cities,
    filials,
    loading,
    isRefreshing,
    updateFilters,
    clearAllFilters,
    refreshData,
    activeFiltersCount,
  } = useAnalyticsData()
  
  // Chart visibility state
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({
    dailyStats: true,
    hourlyStats: true,
    topExpeditors: true,
    topProjects: true,
    topCities: true,
    paymentMethods: true,
    warehouseDistribution: true,
  })
  
  // Chart modes state
  const [chartModes, setChartModes] = useState<ChartModes>({
    dailyStats: 'count',
    hourlyStats: 'count',
    topExpeditors: 'sum',
    topProjects: 'count',
    topCities: 'count',
    paymentMethods: 'sum',
    warehouseDistribution: 'count',
  })
  
  // Daily chart grouping mode
  const [dailyGroupingMode, setDailyGroupingMode] = useState<'day' | 'week' | 'month'>('day')
  
  // Get optimized chart data
  const {
    dailyChartData,
    hourlyChartData,
    paymentChartData,
    expeditorChartData,
    projectChartData,
    cityChartData,
    warehouseChartData,
    COLORS
  } = useChartData({ statistics, chartModes, dailyGroupingMode })
  
  // Memoized filter change handler
  const handleFilterChange = useCallback((key: string, value: any) => {
    updateFilters({ [key]: value })
  }, [updateFilters])
  
  // Memoized chart mode toggle
  const toggleChartMode = useCallback((chart: keyof ChartModes) => {
    setChartModes(prev => ({
      ...prev,
      [chart]: prev[chart] === 'count' ? 'sum' : 'count'
    }))
  }, [])
  
  // Memoized chart visibility toggle
  const toggleChartVisibility = useCallback((chart: keyof ChartVisibility) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chart]: !prev[chart]
    }))
  }, [])
  
  // Memoized export handler
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
  
  // Loading state
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
              onClick={refreshData}
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
        <MemoizedMetricsCards statistics={statistics} />

        {/* Filters */}
        <MemoizedFilters
          filters={{
            dateRange: { from: undefined, to: undefined },
            project: "",
            sklad: "",
            city: "",
            filial: "",
            status: "",
          }}
          onFilterChange={handleFilterChange}
          onClearAllFilters={clearAllFilters}
          activeFiltersCount={activeFiltersCount}
          projects={projects}
          sklads={sklads}
          cities={cities}
          filials={filials}
        />

        {/* Charts Grid */}
        {statistics && (
          <div className="space-y-6">
            {/* Daily Statistics */}
            {visibleCharts.dailyStats && (
              <MemoizedChart
                data={dailyChartData}
                title={t('dailyCheckDistribution')}
                icon={<LineChart className="h-5 w-5" />}
                mode={chartModes.dailyStats}
                onModeChange={(mode) => toggleChartMode('dailyStats')}
                groupingMode={dailyGroupingMode}
                onGroupingChange={setDailyGroupingMode}
                showGrouping={true}
                tooltip={CustomTooltip}
                color={COLORS[0]}
                dataKey={chartModes.dailyStats === 'count' ? 'checks' : 'sum'}
                chartType="area"
              />
            )}

            {/* Payment Methods Distribution */}
            {visibleCharts.paymentMethods && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MemoizedChart
                  data={paymentChartData}
                  title={t('paymentMethodsDistribution')}
                  icon={<PieChart className="h-5 w-5" />}
                  mode={chartModes.paymentMethods}
                  onModeChange={(mode) => toggleChartMode('paymentMethods')}
                  tooltip={PaymentTooltip}
                  color={COLORS[1]}
                  dataKey="value"
                  chartType="pie"
                />

                {/* Hourly Distribution */}
                {visibleCharts.hourlyStats && (
                  <MemoizedChart
                    data={hourlyChartData}
                    title={t('hourlyDistribution')}
                    icon={<Clock className="h-5 w-5" />}
                    mode={chartModes.hourlyStats}
                    onModeChange={(mode) => toggleChartMode('hourlyStats')}
                    tooltip={CustomTooltip}
                    color={COLORS[2]}
                    dataKey={chartModes.hourlyStats === 'count' ? 'checks' : 'sum'}
                    chartType="bar"
                  />
                )}
              </div>
            )}

            {/* Top Expeditors */}
            {visibleCharts.topExpeditors && (
              <MemoizedChart
                data={expeditorChartData}
                title={t('topExpeditors')}
                icon={<Users className="h-5 w-5" />}
                mode={chartModes.topExpeditors}
                onModeChange={(mode) => toggleChartMode('topExpeditors')}
                tooltip={ExpeditorTooltip}
                color={COLORS[3]}
                dataKey={chartModes.topExpeditors === 'count' ? 'checks' : 'sum'}
                chartType="bar"
              />
            )}

            {/* Projects and Cities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visibleCharts.topProjects && (
                <MemoizedChart
                  data={projectChartData}
                  title={t('topProjects')}
                  icon={<Package className="h-5 w-5" />}
                  mode={chartModes.topProjects}
                  onModeChange={(mode) => toggleChartMode('topProjects')}
                  tooltip={CustomTooltip}
                  color={COLORS[4]}
                  dataKey={chartModes.topProjects === 'count' ? 'checks' : 'sum'}
                  chartType="bar"
                />
              )}

              {visibleCharts.topCities && (
                <MemoizedChart
                  data={cityChartData}
                  title={t('topCities')}
                  icon={<MapPin className="h-5 w-5" />}
                  mode={chartModes.topCities}
                  onModeChange={(mode) => toggleChartMode('topCities')}
                  tooltip={CustomTooltip}
                  color={COLORS[5]}
                  dataKey={chartModes.topCities === 'count' ? 'checks' : 'sum'}
                  chartType="bar"
                />
              )}
            </div>

            {/* Warehouse Distribution */}
            {visibleCharts.warehouseDistribution && (
              <MemoizedChart
                data={warehouseChartData}
                title={t('warehouseDistribution')}
                icon={<Package className="h-5 w-5" />}
                mode={chartModes.warehouseDistribution}
                onModeChange={(mode) => toggleChartMode('warehouseDistribution')}
                tooltip={CustomTooltip}
                color={COLORS[6]}
                dataKey={chartModes.warehouseDistribution === 'count' ? 'checks' : 'sum'}
                chartType="bar"
              />
            )}
          </div>
        )}

        {/* Chart Visibility Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t('chartVisibilitySettings')}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(visibleCharts).map(([chart, isVisible]) => (
              <Button
                key={chart}
                variant={isVisible ? "default" : "outline"}
                onClick={() => toggleChartVisibility(chart as keyof ChartVisibility)}
                className="justify-start"
              >
                {isVisible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {chart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

OptimizedAnalyticsPageContent.displayName = "OptimizedAnalyticsPageContent"

// Main optimized analytics page
const OptimizedAnalyticsPage = memo(() => {
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
      <OptimizedAnalyticsPageContent />
    </Suspense>
  )
})

OptimizedAnalyticsPage.displayName = "OptimizedAnalyticsPage"

export default OptimizedAnalyticsPage
