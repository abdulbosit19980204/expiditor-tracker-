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
  Filter,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "../../lib/simple-i18n"
import { useOptimizedAnalyticsData } from "../../hooks/use-optimized-analytics-data"
import { useChartData } from "../../hooks/use-chart-data"
import PerformanceOptimizedMap from "../../components/analytics/performance-optimized-map"
import PerformanceOptimizedChart from "../../components/analytics/performance-optimized-chart"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

// Memoized filter component
const MemoizedFilters = memo(({ 
  filters, 
  projects, 
  sklads, 
  cities, 
  filials, 
  onFilterChange, 
  activeFiltersCount,
  onClearFilters 
}: {
  filters: any
  projects: any[]
  sklads: any[]
  cities: any[]
  filials: any[]
  onFilterChange: (key: string, value: any) => void
  activeFiltersCount: number
  onClearFilters: () => void
}) => {
  const { t } = useTranslation()

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('filters')}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </CardTitle>
        {activeFiltersCount > 0 && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            {t('clearAll')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('dateRange')}</label>
            <DatePickerWithRange
              dateRange={filters.dateRange}
              onDateRangeChange={(range) => onFilterChange('dateRange', range || { from: undefined, to: undefined })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('project')}</label>
            <Select value={filters.project} onValueChange={(value) => onFilterChange('project', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectProject')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allProjects')}</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('warehouse')}</label>
            <Select value={filters.sklad} onValueChange={(value) => onFilterChange('sklad', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectWarehouse')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allWarehouses')}</SelectItem>
                {sklads.map((sklad) => (
                  <SelectItem key={sklad.id} value={sklad.id.toString()}>
                    {sklad.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('city')}</label>
            <Select value={filters.city} onValueChange={(value) => onFilterChange('city', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectCity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allCities')}</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('branch')}</label>
            <Select value={filters.filial} onValueChange={(value) => onFilterChange('filial', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectBranch')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allBranches')}</SelectItem>
                {filials.map((filial) => (
                  <SelectItem key={filial.id} value={filial.id.toString()}>
                    {filial.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('status')}</label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

MemoizedFilters.displayName = "MemoizedFilters"

// Main optimized analytics page
const PerformanceOptimizedAnalyticsPage = memo(() => {
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
    filters
  } = useOptimizedAnalyticsData()
  
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
    console.log("Exporting all data...")
    // Implementation for data export
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {t('home')}
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t('analyticsDashboard')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('export')}
              </Button>
              
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('settings')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Filters */}
            <MemoizedFilters
              filters={filters}
              projects={projects}
              sklads={sklads}
              cities={cities}
              filials={filials}
              onFilterChange={handleFilterChange}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearAllFilters}
            />

            {/* Map */}
            <div className="mb-8">
              <PerformanceOptimizedMap
                checks={statistics?.checks || []}
                selectedExpeditor={null}
                loading={loading}
                focusLocation={null}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Statistics Chart */}
              <PerformanceOptimizedChart
                title={t('dailyStatistics')}
                data={dailyChartData}
                dataKey={chartModes.dailyStats}
                type="area"
                colors={COLORS}
                visible={visibleCharts.dailyStats}
                onToggleVisibility={() => toggleChartVisibility('dailyStats')}
                chartMode={chartModes.dailyStats}
                onModeChange={(mode) => toggleChartMode('dailyStats')}
                showModeToggle={true}
                showGroupingToggle={true}
                groupingMode={dailyGroupingMode}
                onGroupingChange={setDailyGroupingMode}
                customTooltip="default"
              />

              {/* Hourly Statistics Chart */}
              <PerformanceOptimizedChart
                title={t('hourlyStatistics')}
                data={hourlyChartData}
                dataKey={chartModes.hourlyStats}
                type="line"
                colors={COLORS}
                visible={visibleCharts.hourlyStats}
                onToggleVisibility={() => toggleChartVisibility('hourlyStats')}
                chartMode={chartModes.hourlyStats}
                onModeChange={(mode) => toggleChartMode('hourlyStats')}
                showModeToggle={true}
                customTooltip="default"
              />

              {/* Top Expeditors Chart */}
              <PerformanceOptimizedChart
                title={t('topExpeditors')}
                data={expeditorChartData}
                dataKey={chartModes.topExpeditors}
                type="bar"
                colors={COLORS}
                visible={visibleCharts.topExpeditors}
                onToggleVisibility={() => toggleChartVisibility('topExpeditors')}
                chartMode={chartModes.topExpeditors}
                onModeChange={(mode) => toggleChartMode('topExpeditors')}
                showModeToggle={true}
                customTooltip="expeditor"
              />

              {/* Top Projects Chart */}
              <PerformanceOptimizedChart
                title={t('topProjects')}
                data={projectChartData}
                dataKey={chartModes.topProjects}
                type="bar"
                colors={COLORS}
                visible={visibleCharts.topProjects}
                onToggleVisibility={() => toggleChartVisibility('topProjects')}
                chartMode={chartModes.topProjects}
                onModeChange={(mode) => toggleChartMode('topProjects')}
                showModeToggle={true}
                customTooltip="default"
              />

              {/* Top Cities Chart */}
              <PerformanceOptimizedChart
                title={t('topCities')}
                data={cityChartData}
                dataKey={chartModes.topCities}
                type="bar"
                colors={COLORS}
                visible={visibleCharts.topCities}
                onToggleVisibility={() => toggleChartVisibility('topCities')}
                chartMode={chartModes.topCities}
                onModeChange={(mode) => toggleChartMode('topCities')}
                showModeToggle={true}
                customTooltip="default"
              />

              {/* Payment Methods Chart */}
              <PerformanceOptimizedChart
                title={t('paymentMethods')}
                data={paymentChartData}
                dataKey={chartModes.paymentMethods}
                type="pie"
                colors={COLORS}
                visible={visibleCharts.paymentMethods}
                onToggleVisibility={() => toggleChartVisibility('paymentMethods')}
                chartMode={chartModes.paymentMethods}
                onModeChange={(mode) => toggleChartMode('paymentMethods')}
                showModeToggle={true}
                customTooltip="payment"
              />

              {/* Warehouse Distribution Chart */}
              <PerformanceOptimizedChart
                title={t('warehouseDistribution')}
                data={warehouseChartData}
                dataKey={chartModes.warehouseDistribution}
                type="pie"
                colors={COLORS}
                visible={visibleCharts.warehouseDistribution}
                onToggleVisibility={() => toggleChartVisibility('warehouseDistribution')}
                chartMode={chartModes.warehouseDistribution}
                onModeChange={(mode) => toggleChartMode('warehouseDistribution')}
                showModeToggle={true}
                customTooltip="default"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
})

PerformanceOptimizedAnalyticsPage.displayName = "PerformanceOptimizedAnalyticsPage"

export default PerformanceOptimizedAnalyticsPage
