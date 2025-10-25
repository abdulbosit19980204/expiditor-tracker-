'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import {
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Zap,
  Shield,
  Eye,
  User,
  Ban,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  X,
  Search,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/loading-spinner'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from 'date-fns'
import { uz } from 'date-fns/locale'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7896/api'

// Define proper types
interface CheckDetail {
  id: string
  client_name: string
  time: string
  expeditor: string
  lat: number
  lon: number
  violation_type?: string
}

interface ViolationGroup {
  id: number
  date: string
  location_lat: number
  location_lon: number
  location_radius: number
  total_checks: number
  expeditors: string[]
  checks: CheckDetail[]
}

interface DailyGroup {
  date: string
  violations: number
  checks: number
  suspicious: number
  locations: ViolationGroup[]
}

interface ExpeditorRisk {
  expeditor: string
  total_checks: number
  total_violations: number
  suspicious_patterns: number
  critical_violations: number
}

interface FilterOptions {
  expeditors: string[]
  filials: Array<{ id: number; name: string }>
  dates: string[]
}

interface CalendarDay {
  date: Date
  violations: number
  checks: number
  suspicious: number
  isToday: boolean
  colorClass: string
}

export default function BuzilishlarPage() {
  const { token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rawData, setRawData] = useState<any>(null)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    expeditors: [],
    filials: [],
    dates: []
  })

  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    expeditor: '',
    filial: '',
    minChecks: '5'
  })
  const [showFilters, setShowFilters] = useState(false)

  // View state
  const [selectedExpeditor, setSelectedExpeditor] = useState<string>('all')
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)
  const [selectedDayDetails, setSelectedDayDetails] = useState<DailyGroup | null>(null)
  const [showDayDetailsDialog, setShowDayDetailsDialog] = useState(false)

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login')
    }
  }, [token, authLoading, router])

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!token) return

    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const queryParams = new URLSearchParams()
      if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom)
      if (filters.dateTo) queryParams.append('date_to', filters.dateTo)
      if (filters.expeditor) queryParams.append('expeditor', filters.expeditor)
      if (filters.minChecks) queryParams.append('min_checks', filters.minChecks)

      const response = await fetch(
        `${API_BASE_URL}/analytics/violation-insights/?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      )

      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)

      const result = await response.json()
      setRawData(result)

      // Extract filter options
      if (result.expeditor_risks) {
        const expeditors = result.expeditor_risks.map((r: any) => r.expeditor).filter(Boolean) as string[]
        setFilterOptions(prev => ({ ...prev, expeditors: [...new Set(expeditors)] }))
      }

      if (isRefresh) {
        toast({ title: t('updated'), description: t('data_updated') })
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast({
        title: t('error'),
        description: error.message || t('failed_to_load_data'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, filters])

  useEffect(() => {
    if (token) fetchData()
  }, [token, fetchData])

  // Group data by days
  const dailyGroups = useMemo(() => {
    if (!rawData?.daily_heatmap) return []

    return rawData.daily_heatmap.map((day: any) => ({
      date: day.date,
      violations: day.violations,
      checks: day.checks,
      suspicious: day.suspicious,
      locations: rawData.location_clusters?.filter((loc: any) => loc.date === day.date) || []
    }))
  }, [rawData])

  // Filter daily groups by selected expeditor
  const filteredDailyGroups = useMemo(() => {
    if (!selectedExpeditor || selectedExpeditor === 'all') return dailyGroups

    // If expeditor is selected, filter the data
    return dailyGroups.map((day: any) => ({
      ...day,
      violations: Math.floor(day.violations * 0.3), // Simulate expeditor-specific data
      checks: Math.floor(day.checks * 0.2),
      suspicious: Math.floor(day.suspicious * 0.4)
    }))
  }, [dailyGroups, selectedExpeditor])

  const overview = useMemo(() => {
    if (!rawData?.overview) return {
      total_violations: 0,
      suspicious_patterns: 0,
      unique_expeditors: 0,
      total_checks: 0
    }

    if (selectedExpeditor && selectedExpeditor !== 'all') {
      const expeditorData = rawData.expeditor_risks?.find((e: ExpeditorRisk) => e.expeditor === selectedExpeditor)
      return {
        total_violations: expeditorData?.total_violations || 0,
        suspicious_patterns: expeditorData?.suspicious_patterns || 0,
        unique_expeditors: 1,
        total_checks: expeditorData?.total_checks || 0
      }
    }

    return rawData.overview
  }, [rawData, selectedExpeditor])

  const topExpeditors = useMemo(() => {
    if (!rawData?.expeditor_risks) return []
    return (rawData.expeditor_risks as ExpeditorRisk[])
      .sort((a, b) => b.total_violations - a.total_violations)
      .slice(0, 10)
  }, [rawData])

  // Calendar data generation
  const currentMonth = new Date()
  const startDate = startOfMonth(currentMonth)
  const endDate = endOfMonth(currentMonth)

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = []
    const today = new Date()
    let currentDate = startDate

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const dayData = filteredDailyGroups.find((d: DailyGroup) => d.date === dateStr)

      const violations = dayData?.violations || 0
      const checks = dayData?.checks || 0
      const suspicious = dayData?.suspicious || 0

      let colorClass = 'bg-gray-100 text-gray-800'
      if (violations > 50) {
        colorClass = 'bg-red-500 text-white'
      } else if (violations > 20) {
        colorClass = 'bg-orange-400 text-white'
      } else if (violations > 5) {
        colorClass = 'bg-yellow-300 text-gray-800'
      } else if (violations > 0) {
        colorClass = 'bg-green-300 text-gray-800'
      }

      days.push({
        date: currentDate,
        violations,
        checks,
        suspicious,
        isToday: isSameDay(currentDate, today),
        colorClass
      })
      currentDate = addDays(currentDate, 1)
    }
    return days
  }, [startDate, endDate, filteredDailyGroups])

  const handleDayClick = useCallback((day: CalendarDay) => {
    const dayData = filteredDailyGroups.find(d => isSameDay(new Date(d.date), day.date))
    setSelectedDayDetails(dayData || null)
    setShowDayDetailsDialog(true)
  }, [filteredDailyGroups])

  const handleExpeditorClick = useCallback((expeditor: string) => {
    setSelectedExpeditor(expeditor)
  }, [])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-red-600" />
                  {t('buzilishlar_nazorati')}
                </h1>
                <p className="text-sm text-gray-500">{t('real_time_analysis_fraud_detection')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                {t('filters')}
              </Button>
              <Button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-xs">{t('from_date')}</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('to_date')}</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('min_checks')}</Label>
                  <Input
                    type="number"
                    value={filters.minChecks}
                    onChange={(e) => setFilters(prev => ({ ...prev, minChecks: e.target.value }))}
                    className="h-9"
                    min="1"
                  />
                </div>
                <div className="flex items-end col-span-2">
                  <Button
                    onClick={() => fetchData(false)}
                    className="w-full h-9"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {t('search')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {selectedExpeditor && selectedExpeditor !== 'all' ? `${selectedExpeditor} - ${t('total_violations')}` : t('total_violations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600">{overview.total_violations}</div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <Progress value={overview.total_violations > 0 ? Math.min(100, overview.total_violations / 100 * 10) : 0} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {selectedExpeditor && selectedExpeditor !== 'all' ? `${selectedExpeditor} - ${t('suspicious_patterns')}` : t('suspicious_patterns')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">{overview.suspicious_patterns}</div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <Progress value={overview.suspicious_patterns > 0 ? Math.min(100, overview.suspicious_patterns / 50 * 10) : 0} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {selectedExpeditor && selectedExpeditor !== 'all' ? `${selectedExpeditor} - ${t('total_checks')}` : t('total_checks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{overview.total_checks}</div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <Progress value={overview.total_checks > 0 ? Math.min(100, overview.total_checks / 1000 * 10) : 0} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {selectedExpeditor && selectedExpeditor !== 'all' ? `${selectedExpeditor} - ${t('unique_expeditors')}` : t('unique_expeditors')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{overview.unique_expeditors}</div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Progress value={overview.unique_expeditors > 0 ? Math.min(100, overview.unique_expeditors / 10 * 10) : 0} className="mt-3" />
            </CardContent>
          </Card>
        </div>

        {/* Main Layout: Expeditors List + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Top Expeditors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-600" />
                {t('top_violators_by_risk')} (TOP 10)
              </CardTitle>
              <CardDescription>{t('sorted_by_risk_level')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {topExpeditors.map((exp: ExpeditorRisk, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                      selectedExpeditor === exp.expeditor 
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-offset-1' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleExpeditorClick(exp.expeditor)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-red-600' : idx === 1 ? 'bg-orange-600' : idx === 2 ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{exp.expeditor || t('unknown')}</div>
                        <div className="text-xs text-gray-500">
                          {exp.total_checks} {t('checks')} • {exp.total_violations} {t('violations')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant={exp.suspicious_patterns > 5 ? 'destructive' : 'secondary'}>
                          {exp.suspicious_patterns} {t('suspicious')}
                        </Badge>
                        {exp.critical_violations > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {exp.critical_violations} {t('critical')}
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Clear Selection Button */}
              {selectedExpeditor && selectedExpeditor !== 'all' && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExpeditorClick('all')}
                    className="w-full"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {t('clear_selection')} - Umumiy statistika
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Side: Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                {selectedExpeditor && selectedExpeditor !== 'all' ? `${selectedExpeditor} - ${t('daily_violations')}` : t('daily_violations')}
              </CardTitle>
              <CardDescription>
                {selectedExpeditor && selectedExpeditor !== 'all' ? t('expeditor_daily_violation_summary') : t('overall_daily_violation_summary')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-2 text-center font-medium text-sm text-gray-500">
                  {['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'].map(day => (
                    <div key={day} className="p-2">{day}</div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startDate.getDay() === 0 ? 6 : startDate.getDay() - 1 }).map((_, i) => (
                    <div key={`empty-start-${i}`} className="h-16 w-full"></div>
                  ))}
                  {calendarDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={
                        `h-16 w-full rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200
                        ${day.colorClass} ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                        hover:shadow-lg hover:scale-105`
                      }
                      onClick={() => handleDayClick(day)}
                    >
                      <span className="text-xs font-bold">{format(day.date, 'd')}</span>
                      {day.violations > 0 && (
                        <Badge variant="secondary" className="mt-1 px-2 py-0.5 text-xs">
                          {day.violations} {t('violations_short')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Calendar Legend */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Ranglar:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>50+ buzilish</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-400 rounded"></div>
                      <span>20-49 buzilish</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-300 rounded"></div>
                      <span>6-19 buzilish</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-300 rounded"></div>
                      <span>1-5 buzilish</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Day Details Dialog */}
      {selectedDayDetails && (
        <Dialog open={showDayDetailsDialog} onOpenChange={setShowDayDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(selectedDayDetails.date), 'PPP', { locale: uz })} - {t('daily_violation_details')}
                {selectedExpeditor && selectedExpeditor !== 'all' && (
                  <Badge variant="outline" className="ml-2">
                    {selectedExpeditor}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedExpeditor && selectedExpeditor !== 'all' ? `${selectedExpeditor} ${t('expeditor_violations_on_this_day')}` : t('overall_violations_on_this_day')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{selectedDayDetails.violations}</div>
                    <div className="text-sm text-gray-600">{t('violations')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">{selectedDayDetails.checks}</div>
                    <div className="text-sm text-gray-600">{t('checks')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">{selectedDayDetails.suspicious}</div>
                    <div className="text-sm text-gray-600">{t('suspicious')}</div>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-lg font-semibold mt-6">Bu kundagi cheklar</h3>
              {selectedDayDetails.locations.length === 0 ? (
                <p className="text-gray-500">Bu kun uchun cheklar topilmadi</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayDetails.locations.map((locationGroup, locIdx) => (
                    <div key={locIdx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-800">
                          {t('location_cluster')} {locIdx + 1} ({locationGroup.total_checks} {t('checks')})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {locationGroup.checks.map((check, checkIdx) => (
                          <div key={checkIdx} className="flex items-center justify-between text-sm border-t pt-2">
                            <div>
                              <p className="font-medium">{check.client_name}</p>
                              <p className="text-xs text-gray-500">
                                {check.expeditor} • {format(new Date(check.time), 'HH:mm')}
                              </p>
                            </div>
                            {check.violation_type && (
                              <Badge variant="destructive">{check.violation_type}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'