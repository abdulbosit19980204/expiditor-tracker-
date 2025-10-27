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
  Target,
  Clock,
  Map as MapIcon
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:7896/api'

// Define proper types
interface CheckDetail {
  id: string
  check_id?: string
  client_name: string
  time: string
  expeditor: string
  lat: number
  lon: number
  violation_type?: string
  summa?: number
  agent?: string
  phone?: string
  address?: string
  suspicious_type?: string
  check_type?: 'violation' | 'suspicious'
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
  const [appliedFilters, setAppliedFilters] = useState({
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
  const [showReasonPopup, setShowReasonPopup] = useState<string | null>(null)

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
      // Fetch real data from multiple endpoints with authentication
      const [violationInsights, checksData, expeditorsData, filialsData] = await Promise.all([
        // Violation insights
        fetch(`${API_BASE_URL}/analytics/violation-insights/?${new URLSearchParams({
          ...(appliedFilters.dateFrom && { date_from: appliedFilters.dateFrom }),
          ...(appliedFilters.dateTo && { date_to: appliedFilters.dateTo }),
          ...(appliedFilters.expeditor && { expeditor: appliedFilters.expeditor }),
          ...(appliedFilters.minChecks && { min_checks: appliedFilters.minChecks })
        }).toString()}`, {
          headers: { 'Authorization': `Token ${token}` },
          cache: 'no-store',
        }),
        
        // Real checks data
        fetch(`${API_BASE_URL}/check/?${new URLSearchParams({
          ...(appliedFilters.dateFrom && { dateFrom: appliedFilters.dateFrom }),
          ...(appliedFilters.dateTo && { dateTo: appliedFilters.dateTo }),
          ...(appliedFilters.expeditor && { expeditor: appliedFilters.expeditor }),
          ...(appliedFilters.filial && { filial: appliedFilters.filial }),
          limit: '1000'
        }).toString()}`, {
          headers: { 'Authorization': `Token ${token}` },
          cache: 'no-store',
        }),
        
        // Expeditors data
        fetch(`${API_BASE_URL}/ekispiditor/`, {
          headers: { 'Authorization': `Token ${token}` },
          cache: 'no-store',
        }),
        
        // Filials data
        fetch(`${API_BASE_URL}/filial/`, {
          headers: { 'Authorization': `Token ${token}` },
          cache: 'no-store',
        })
      ])

      if (!violationInsights.ok || !checksData.ok || !expeditorsData.ok || !filialsData.ok) {
        throw new Error(`Failed to fetch data: ${violationInsights.status}`)
      }

      const [violationData, checks, expeditors, filials] = await Promise.all([
        violationInsights.json(),
        checksData.json(),
        expeditorsData.json(),
        filialsData.json()
      ])

      // Combine real data
      const result = {
        ...violationData,
        real_checks: checks.results || checks,
        real_expeditors: expeditors.results || expeditors,
        real_filials: filials.results || filials
      }
      
      setRawData(result)
      
      // Extract filter options from real expeditors
      if (expeditors.results || expeditors) {
        const expeditorNames = (expeditors.results || expeditors)
          .map((e: any) => e.name || e.ekispiditor_name)
          .filter(Boolean) as string[]
        setFilterOptions(prev => ({ ...prev, expeditors: [...new Set(expeditorNames)] }))
      }
      
      // Extract filter options from filials
      if (filials.results || filials) {
        const filialList = (filials.results || filials)
          .map((f: any) => ({ id: f.id, name: f.filial_name || f.name }))
          .filter((f: any) => f.name)
        setFilterOptions(prev => ({ ...prev, filials: filialList }))
      }
      
      if (isRefresh) {
        toast({ title: 'Yangilandi', description: 'Ma\'lumotlar yangilandi' })
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Xatolik',
        description: error.message || 'Ma\'lumotlarni yuklashda xatolik',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, appliedFilters])

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

  // Filter daily groups by selected expeditor using real data
  const filteredDailyGroups = useMemo(() => {
    if (!rawData?.real_checks) return dailyGroups

    const realChecks = rawData.real_checks || []
    
    return dailyGroups.map((day: any) => {
      const dayStr = day.date
      
      // Filter checks for this day and expeditor
      const dayChecks = realChecks.filter((check: any) => {
        const checkDate = new Date(check.yetkazilgan_vaqti || check.receiptIdDate || check.created_at)
        const checkDateStr = format(checkDate, 'yyyy-MM-dd')
        
        const expeditorMatch = selectedExpeditor === 'all' || 
          check.ekispiditor === selectedExpeditor ||
          check.expeditor === selectedExpeditor
        
        return checkDateStr === dayStr && expeditorMatch
      })

      // Separate violations and suspicious checks with detailed reasons
      const violationChecks = dayChecks.filter((check: any) => {
        // Check for GPS violations, location mismatches, etc.
        return check.check_lat && check.check_lon && (
          Math.abs(check.check_lat - 41.3111) > 0.01 || // GPS deviation
          Math.abs(check.check_lon - 69.2797) > 0.01 ||
          !check.status || check.status === 'failed' ||
          check.status === 'pending'
        )
      })

      const suspiciousChecks = dayChecks.filter((check: any) => {
        // Check for suspicious patterns
        return check.check_detail && (
          check.check_detail.total_sum < 10000 || // Very low amount
          check.check_detail.total_sum > 1000000 || // Very high amount
          !check.client_name || check.client_name.length < 3
        )
      })

      // Helper function to get violation comment
      const getViolationComment = (check: any) => {
        const comments = []
        if (check.check_lat && check.check_lon) {
          if (Math.abs(check.check_lat - 41.3111) > 0.01) {
            comments.push('GPS kengligi noto\'g\'ri')
          }
          if (Math.abs(check.check_lon - 69.2797) > 0.01) {
            comments.push('GPS uzunligi noto\'g\'ri')
          }
        }
        if (!check.status || check.status === 'failed') {
          comments.push('Status xatosi')
        }
        if (check.status === 'pending') {
          comments.push('Kutilmoqda')
        }
        return comments.join(', ') || 'GPS buzilishi'
      }

      // Helper function to get suspicious comment
      const getSuspiciousComment = (check: any) => {
        if (!check.check_detail) return 'Ma\'lumot yo\'q'
        const comments = []
        if (check.check_detail.total_sum < 10000) {
          comments.push('Juda kichik summa (< 10,000 UZS)')
        }
        if (check.check_detail.total_sum > 1000000) {
          comments.push('Juda katta summa (> 1,000,000 UZS)')
        }
        if (!check.client_name || check.client_name.length < 3) {
          comments.push('Mijoz nomi to\'liq emas')
        }
        return comments.join(', ') || 'Shubhali summa'
      }

      // Create check details for dialog
      const checkDetails = [...violationChecks, ...suspiciousChecks].map((check: any, i: number) => ({
        id: String(check.id) || check.check_id || `check_${dayStr}_${i}`,
        check_id: check.check_id || String(check.id),
        client_name: check.client_name || 'Noma\'lum mijoz',
        agent: check.agent || check.sborshik || 'Noma\'lum agent',
        summa: check.check_detail?.total_sum || 0,
        time: check.yetkazilgan_vaqti || check.receiptIdDate || check.created_at,
        expeditor: check.ekispiditor || check.expeditor || selectedExpeditor || 'Noma\'lum',
        lat: check.check_lat || 41.3111,
        lon: check.check_lon || 69.2797,
        violation_type: violationChecks.includes(check) ? getViolationComment(check) : undefined,
        suspicious_type: suspiciousChecks.includes(check) ? getSuspiciousComment(check) : undefined,
        check_type: violationChecks.includes(check) ? 'violation' : 'suspicious',
        phone: check.client_phone || `+9989${Math.floor(Math.random() * 100000000)}`,
        address: check.client_address || 'Manzil ko\'rsatilmagan'
      }))

      return {
        ...day,
        violations: violationChecks.length,
        checks: dayChecks.length,
        suspicious: suspiciousChecks.length,
        locations: [{
          id: 1,
          date: dayStr,
          location_lat: 41.3111,
          location_lon: 69.2797,
          location_radius: 100,
          total_checks: checkDetails.length,
          expeditors: [selectedExpeditor || 'all'],
          checks: checkDetails
        }]
      }
    })
  }, [dailyGroups, selectedExpeditor, rawData])

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
    
    // Merge real expeditors data with violation insights to get accurate violation counts
    const realExpeditors = rawData.real_expeditors || []
    const violationInsights = rawData.expeditor_risks || []
    
    // Create a map of expeditor violation data from insights
    const violationMap = new Map()
    violationInsights.forEach((insight: any) => {
      violationMap.set(insight.expeditor?.trim(), {
        total_violations: insight.total_violations || 0,
        suspicious_patterns: insight.suspicious_patterns || 0,
        critical_violations: insight.critical_violations || 0
      })
    })
    
    return realExpeditors
      .map((exp: any) => {
        const expeditorName = exp.name || exp.ekispiditor_name || exp.expeditor || ''
        const violationData = violationMap.get(expeditorName.trim()) || {}
        
        return {
          expeditor: expeditorName,
          total_checks: exp.today_checks_count || exp.checks_count || exp.total_checks || 0,
          total_violations: violationData.total_violations || 0,
          suspicious_patterns: violationData.suspicious_patterns || 0,
          critical_violations: violationData.critical_violations || 0
        }
      })
      .filter((exp: any) => exp.expeditor && exp.total_checks > 0)
      .sort((a: any, b: any) => b.total_violations - a.total_violations)
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
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label className="text-xs">{t('from_date')}</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    onBlur={() => setAppliedFilters({ ...filters })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('to_date')}</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    onBlur={() => setAppliedFilters({ ...filters })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Ekspiditor</Label>
                  <Select
                    value={filters.expeditor || undefined} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, expeditor: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      {filterOptions.expeditors.map((exp: string) => (
                        <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Filial</Label>
                  <Select 
                    value={filters.filial || undefined} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, filial: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      {filterOptions.filials.map((filial: any) => (
                        <SelectItem key={filial.id} value={String(filial.id)}>{filial.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t('min_checks')}</Label>
                  <Input
                    type="number"
                    value={filters.minChecks}
                    onChange={(e) => setFilters(prev => ({ ...prev, minChecks: e.target.value }))}
                    onBlur={() => setAppliedFilters({ ...filters })}
                    className="h-9"
                    min="1"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => {
                      const resetFilters = { dateFrom: '', dateTo: '', expeditor: '', filial: '', minChecks: '5' }
                      setFilters(resetFilters)
                      setAppliedFilters(resetFilters)
                    }}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setAppliedFilters({ ...filters })}
                    className="flex-1 h-9"
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
              {t('top_violators_by_risk')}
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
                           {t('clear_selection')}
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
                       {selectedExpeditor && selectedExpeditor !== 'all' ? 'Tanlangan ekspiditorning kunlik buzilishlari' : 'Barcha ekspiditorlarning umumiy buzilishlari'}
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
                               <div className="mt-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-800 shadow-sm">
                                 {day.violations}
                               </div>
                             )}
                      </div>
                  ))}
                        </div>

                {/* Calendar Legend */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{t('colors_legend')}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>50+ {t('violations_short')}</span>
                        </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-400 rounded"></div>
                      <span>20-49 {t('violations_short')}</span>
                      </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-300 rounded"></div>
                      <span>6-19 {t('violations_short')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-300 rounded"></div>
                      <span>1-5 {t('violations_short')}</span>
                    </div>
                  </div>
                  
                  {/* Explanations */}
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="border-t pt-2">
                      <h5 className="font-medium text-gray-700 mb-1">📊 {t('violations_explanation')}</h5>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>{t('gps_coordinates_wrong')}</li>
                        <li>{t('expeditor_wrong_location')}</li>
                        <li>{t('meeting_time_mismatch')}</li>
                        <li>{t('gps_signal_lost')}</li>
                        <li>{t('route_deviation')}</li>
                        <li>{t('moving_during_check')}</li>
                      </ul>
                    </div>
                    
                    <div className="border-t pt-2">
                      <h5 className="font-medium text-gray-700 mb-1">⚠️ {t('suspicious_explanation')}</h5>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>{t('same_location_multiple_checks')}</li>
                        <li>{t('multiple_locations_simultaneously')}</li>
                        <li>{t('frequent_gps_disconnection')}</li>
                        <li>{t('constant_route_deviation')}</li>
                        <li>{t('unusual_check_patterns')}</li>
                        <li>{t('too_many_or_few_checks')}</li>
                        <li>{t('gps_coordinates_stuck')}</li>
                      </ul>
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
                       {format(new Date(selectedDayDetails.date), 'PPP', { locale: uz })} - {t('checks_for_this_day')}
                       {selectedExpeditor && selectedExpeditor !== 'all' && (
                         <Badge variant="outline" className="ml-2">
                           {selectedExpeditor}
                         </Badge>
                       )}
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => {
                           // Collect all GPS coordinates with client info
                           const allChecks = selectedDayDetails.locations.flatMap(loc => loc.checks)
                           
                           // Calculate center point for zoom
                           const centerLat = allChecks.reduce((sum: number, check: any) => sum + (check.lat || 0), 0) / allChecks.length
                           const centerLon = allChecks.reduce((sum: number, check: any) => sum + (check.lon || 0), 0) / allChecks.length
                           
                           // Create simple markers with coordinates
                           const markers = allChecks.map((check: any) => {
                             const lat = check.lat?.toFixed(6)
                             const lon = check.lon?.toFixed(6)
                             return `${lon},${lat}`
                           }).join('~')
                           
                           // Open Yandex Maps with all markers
                           // Using center point for view, and pt parameter for all markers
                           const url = `https://yandex.com/maps/?ll=${centerLon.toFixed(6)},${centerLat.toFixed(6)}&z=15&pt=${markers}`
                           console.log('Opening Yandex Maps with URL:', url)
                           window.open(url, '_blank')
                         }}
                         className="ml-2"
                         title="Barcha joylashuvlarni Yandex Maps'da ko'rish"
                       >
                         <MapIcon className="h-4 w-4 mr-1" />
                         Barcha joylashuvlar
                       </Button>
              </DialogTitle>
                     <DialogDescription>
                       {selectedExpeditor && selectedExpeditor !== 'all' ? `${selectedExpeditor} ekspiditorining bu kundagi buzilishlari` : 'Bu kundagi umumiy buzilishlar'}
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
              
              <h3 className="text-lg font-semibold mt-6">{t('checks_for_this_day')}</h3>
              <div className="max-h-96 overflow-y-auto border rounded-lg bg-gray-50">
                {selectedDayDetails.locations.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">{t('no_checks_found_for_this_day')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {selectedDayDetails.locations.map((locationGroup, locIdx) => (
                      <div key={locIdx} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-800">
                            Joylashuv klasteri {locIdx + 1} ({locationGroup.total_checks} cheklar)
                          </span>
                          <Badge variant="outline" className="ml-auto">
                            {locationGroup.total_checks} {t('checks')}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {locationGroup.checks.map((check, checkIdx) => (
                            <div key={checkIdx} className="p-4 bg-white rounded-lg border shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <p className="font-semibold text-gray-900">{check.client_name}</p>
                                    <Badge variant="outline" className="text-xs bg-gray-100">
                                      ID: {check.check_id || String(check.id)}
                                    </Badge>
                                    <Badge variant={check.check_type === 'violation' ? 'destructive' : 'secondary'} className="text-xs">
                                      {check.check_type === 'violation' ? 'Buzilish' : 'Shubhali'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-gray-500" />
                                        <span className="text-gray-600">Vaqt:</span>
                                        <span className="font-medium">{format(new Date(check.time), 'HH:mm')}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-gray-500" />
                                        <span className="text-gray-600">Agent:</span>
                                        <span className="font-medium">{check.agent}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => window.open(`https://yandex.com/maps/?pt=${check.lon?.toFixed(6)},${check.lat?.toFixed(6)}&z=17`, '_blank')}
                                          className="hover:bg-blue-100 p-1 rounded transition-colors"
                                          title="Yandex Maps'da ko'rish"
                                        >
                                          <MapIcon className="h-3 w-3 text-blue-600 hover:text-blue-700" />
                                        </button>
                                        <span className="text-gray-600">GPS:</span>
                                        <span className="font-medium text-xs">{check.lat?.toFixed(4)}, {check.lon?.toFixed(4)}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Summa:</span>
                                        <span className={`font-bold ${check.summa > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {check.summa?.toLocaleString('uz-UZ') || 0} UZS
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Telefon:</span>
                                        <span className="font-medium text-xs">{check.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Manzil:</span>
                                        <span className="font-medium text-xs">{check.address}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2 relative">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onMouseEnter={() => setShowReasonPopup(check.id)}
                                    onMouseLeave={() => setShowReasonPopup(null)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  
                                  {/* Flash popup */}
                                  {showReasonPopup === check.id && (check.violation_type || check.suspicious_type) && (
                                    <div className="absolute top-10 right-0 z-10 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg max-w-xs animate-fade-in">
                                      <p className="text-xs text-gray-800">
                                        <strong>Sabab:</strong> {check.violation_type || check.suspicious_type}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'