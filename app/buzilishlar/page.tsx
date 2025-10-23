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
  Clock, 
  Target,
  Filter,
  RefreshCw,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Zap,
  Shield,
  Activity,
  Eye,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7896/api'

// Define proper types
interface ViolationGroup {
  id: number
  date: string
  location_lat: number
  location_lon: number
  location_radius: number
  total_checks: number
  expeditors: string[]
  checks: Array<{
    id: string
    client_name: string
    time: string
    expeditor: string
    lat: number
    lon: number
  }>
}

interface DailyGroup {
  date: string
  locations: ViolationGroup[]
  total_checks: number
  expeditor_count: number
}

interface FilterOptions {
  expeditors: string[]
  filials: Array<{ id: number; name: string }>
  dates: string[]
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
  const [selectedDay, setSelectedDay] = useState<DailyGroup | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<ViolationGroup | null>(null)
  const [showMapDialog, setShowMapDialog] = useState(false)

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
        const expeditors = result.expeditor_risks.map((r: any) => r.expeditor).filter(Boolean)
        setFilterOptions(prev => ({ ...prev, expeditors: [...new Set(expeditors)] }))
      }
      
      if (isRefresh) {
        toast({ title: "Yangilandi", description: "Ma'lumotlar yangilandi" })
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast({
        title: "Xatolik",
        description: error.message || "Ma'lumotlarni yuklashda xatolik",
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
      locations: [] // Will be populated from location_clusters
    }))
  }, [rawData])

  const overview = rawData?.overview || {
    total_violations: 0,
    suspicious_patterns: 0,
    unique_expeditors: 0,
    total_checks: 0
  }

  const topExpeditors = (rawData?.expeditor_risks || []).slice(0, 10)

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
                Filtrlar
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
              <Button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Yangilash
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-xs">Sanadan</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Sanagacha</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Ekspiditor</Label>
                  <Select
                    value={filters.expeditor}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, expeditor: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      {filterOptions.expeditors.map((exp, idx) => (
                        <SelectItem key={idx} value={exp}>{exp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Min Cheklar</Label>
                  <Input
                    type="number"
                    value={filters.minChecks}
                    onChange={(e) => setFilters(prev => ({ ...prev, minChecks: e.target.value }))}
                    className="h-9"
                    min="1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => fetchData(false)}
                    className="w-full h-9"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Qidirish
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
              <CardTitle className="text-sm font-medium text-gray-600">Jami Buzilishlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600">{overview.total_violations}</div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Shubhali Holatlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">{overview.suspicious_patterns}</div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ekspiditorlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{overview.unique_expeditors}</div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Jami Cheklar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{overview.total_checks}</div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Expeditors */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Eng Ko'p Buzilish Qilgan Ekspiditorlar (TOP 10)
            </CardTitle>
            <CardDescription>Risk darajasi bo'yicha tartiblangan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topExpeditors.map((exp: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setFilters(prev => ({ ...prev, expeditor: exp.expeditor }))}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0 ? 'bg-red-600' : idx === 1 ? 'bg-orange-600' : idx === 2 ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{exp.expeditor || 'Noma\'lum'}</div>
                      <div className="text-xs text-gray-500">
                        {exp.total_checks} chek • {exp.total_violations} buzilish
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant={exp.suspicious_patterns > 5 ? 'destructive' : 'secondary'}>
                        {exp.suspicious_patterns} shubhali
                      </Badge>
                      {exp.critical_violations > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {exp.critical_violations} kritik
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
          </CardContent>
        </Card>

        {/* Daily Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Kunlik Buzilishlar
            </CardTitle>
            <CardDescription>Sana bo'yicha gruppalangan buzilishlar</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyGroups.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Ma'lumot topilmadi</p>
            ) : (
              <div className="space-y-3">
                {dailyGroups.map((day: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedDay(day)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {new Date(day.date).getDate()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {day.violations} buzilish • {day.checks} chek
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {day.suspicious > 0 && (
                        <Badge variant="destructive">{day.suspicious} shubhali</Badge>
                      )}
                      <Button variant="outline" size="sm">
                        Ko'rish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Day Details Dialog */}
      {selectedDay && (
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {new Date(selectedDay.date).toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{selectedDay.violations}</div>
                    <div className="text-sm text-gray-600">Buzilishlar</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">{selectedDay.checks}</div>
                    <div className="text-sm text-gray-600">Cheklar</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">{selectedDay.suspicious}</div>
                    <div className="text-sm text-gray-600">Shubhali</div>
                  </CardContent>
                </Card>
              </div>
              
              <p className="text-gray-500 text-center py-4">
                Joylashuv klasterlari keyingi versiyada qo'shiladi
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
