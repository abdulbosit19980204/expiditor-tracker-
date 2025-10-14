"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { useTranslation } from "react-i18next"
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
  EyeOff
} from "lucide-react"
import Link from "next/link"
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
      <div className="space-y-2">
        {data.slice(0, 7).map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.date || item.label}</span>
            <Badge variant="outline">{item.value || item.checks}</Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

function EnhancedStatsContent() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })

  // Filter states
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [selectedSklad, setSelectedSklad] = useState<string>("")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedFilial, setSelectedFilial] = useState<string>("")

  // Filter options
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filials, setFilials] = useState<Filial[]>([])

  // UI states
  const [visiblePanels, setVisiblePanels] = useState<Set<string>>(new Set([
    'overview', 'performance', 'payments', 'trends'
  ]))

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getGlobalStatistics({
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        },
        project: selectedProject || undefined,
        sklad: selectedSklad || undefined,
        city: selectedCity || undefined,
        filial: selectedFilial || undefined,
      })
      setStats(data)
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedProject, selectedSklad, selectedCity, selectedFilial])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const loadFilterOptions = async () => {
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
        console.error("Error loading filter options:", error)
      }
    }
    loadFilterOptions()
  }, [])

  const handleExportCSV = () => {
    if (!stats) return

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

  const togglePanel = (panel: string) => {
    const newVisible = new Set(visiblePanels)
    if (newVisible.has(panel)) {
      newVisible.delete(panel)
    } else {
      newVisible.add(panel)
    }
    setVisiblePanels(newVisible)
  }

  const resetFilters = () => {
    setSelectedProject("")
    setSelectedSklad("")
    setSelectedCity("")
    setSelectedFilial("")
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600">{t('loading')}...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              {t('enhancedStatistics')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('comprehensiveAnalytics')} - {t('dateRange')}: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm px-3 py-2 border rounded-md hover:bg-gray-50"
            >
              <Home className="h-4 w-4" /> {t('home')}
            </Link>
            <Button variant="outline" onClick={loadStats} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {t('refresh')}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!stats}>
              <Download className="h-4 w-4 mr-1" />
              {t('exportCSV')}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('advancedFilters')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('dateRange')}</label>
                <DatePickerWithRange
                  dateRange={dateRange}
                  onDateRangeChange={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                    }
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('project')}</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('allProjects')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('allProjects')}</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.project_name}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('warehouse')}</label>
                <Select value={selectedSklad} onValueChange={setSelectedSklad}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('allWarehouses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('allWarehouses')}</SelectItem>
                    {sklads.map((sklad) => (
                      <SelectItem key={sklad.id} value={sklad.sklad_name}>
                        {sklad.sklad_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('city')}</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('allCities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('allCities')}</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.city_name}>
                        {city.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('filial')}</label>
                <Select value={selectedFilial} onValueChange={setSelectedFilial}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('allFilials')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('allFilials')}</SelectItem>
                    {filials.map((filial) => (
                      <SelectItem key={filial.id} value={filial.id}>
                        {filial.filial_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={resetFilters} variant="outline" size="sm">
                {t('clearAllFilters')}
              </Button>
              <Button onClick={loadStats} disabled={loading} size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                {t('applyFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Panel Visibility Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('customizeView')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'overview', label: t('overview') },
                { key: 'performance', label: t('performanceAnalysis') },
                { key: 'payments', label: t('paymentMethods') },
                { key: 'trends', label: t('trends') },
                { key: 'topPerformers', label: t('topPerformers') },
              ].map((panel) => (
                <Button
                  key={panel.key}
                  variant={visiblePanels.has(panel.key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePanel(panel.key)}
                  className="flex items-center gap-1"
                >
                  {visiblePanels.has(panel.key) ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  {panel.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Panels */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600">{t('loadingStatistics')}...</span>
          </div>
        ) : !stats ? (
          <div className="text-center text-gray-500 py-20">
            {t('noStatisticsAvailable')}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Statistics Panel */}
            <div className="lg:col-span-3">
              <EnhancedStatisticsPanel statistics={stats} />
            </div>

            {/* Additional Charts - only show if panels are visible */}
            {visiblePanels.has('trends') && (
              <>
                <SimpleLineChart 
                  data={stats.dailyStats || []} 
                  title={t('dailyTrends')} 
                />
                <SimpleBarChart 
                  data={stats.topExpeditors?.map(exp => ({ name: exp.name, value: exp.checkCount })) || []} 
                  title={t('topExpeditors')} 
                />
                <SimpleBarChart 
                  data={stats.topCities?.map(city => ({ name: city.name, value: city.checkCount })) || []} 
                  title={t('topCities')} 
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EnhancedStatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600">Loading enhanced statistics...</span>
          </div>
        </div>
      </div>
    }>
      <EnhancedStatsContent />
    </Suspense>
  )
}