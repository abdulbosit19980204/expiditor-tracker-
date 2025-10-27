'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { 
  Eye, 
  Search, 
  Filter,
  X,
  Calendar,
  User,
  MapPin,
  Clock,
  CreditCard,
  Store,
  RefreshCw,
  ExternalLink
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
import { format } from 'date-fns'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:7896/api'

interface Check {
  id: number
  check_id: string
  client_name: string
  client_phone?: string
  client_address?: string
  agent?: string
  sborshik?: string
  expeditor?: string
  project?: string
  city?: string
  sklad?: string
  check_lat?: number
  check_lon?: number
  status?: string
  yetkazilgan_vaqti?: string
  receiptIdDate?: string
  created_at?: string
  check_detail?: {
    total_sum: number
    nalichniy: number
    uzcard: number
    humo: number
    click: number
  }
}

interface CheckDetails {
  [key: string]: any
}

export default function ChecklarPage() {
  const { token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checks, setChecks] = useState<Check[]>([])
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null)
  const [checkDetails, setCheckDetails] = useState<CheckDetails | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  
  const [allChecks, setAllChecks] = useState<Check[]>([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    expeditor: '',
    filial: '',
    city: '',
    search: ''
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  
  // Sort
  const [sortField, setSortField] = useState<'date' | 'summa' | 'client' | 'expeditor'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    expeditors: [] as string[],
    filials: [] as Array<{ id: number; name: string }>,
    cities: [] as string[]
  })

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
      // Fetch checks with filters
      const checksResponse = await fetch(`${API_BASE_URL}/check/?${new URLSearchParams({
        ...(appliedFilters.dateFrom && { dateFrom: appliedFilters.dateFrom }),
        ...(appliedFilters.dateTo && { dateTo: appliedFilters.dateTo }),
        ...(appliedFilters.expeditor && { expeditor: appliedFilters.expeditor }),
        ...(appliedFilters.filial && { filial: appliedFilters.filial }),
        ...(appliedFilters.city && { city: appliedFilters.city }),
        ...(appliedFilters.search && { search: appliedFilters.search }),
        limit: '100'
      }).toString()}`, {
        headers: { 'Authorization': `Token ${token}` },
        cache: 'no-store',
      })

      if (!checksResponse.ok) {
        throw new Error(`Failed to fetch checks: ${checksResponse.status}`)
      }

      const checksData = await checksResponse.json()
      let checksList = checksData.results || checksData
      checksList = Array.isArray(checksList) ? checksList : []
      
      console.log('Fetched checks:', checksList.length)
      
      // Set initial checks (fallback)
      setAllChecks(checksList)

      // Fetch filter options and map expeditors to checks
      const [expeditorsResponse, filialsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/ekispiditor/`, {
          headers: { 'Authorization': `Token ${token}` },
          cache: 'no-store',
        }),
        fetch(`${API_BASE_URL}/filial/`, {
          headers: { 'Authorization': `Token ${token}` },
          cache: 'no-store',
        })
      ])

      if (expeditorsResponse.ok) {
        const expeditorsData = await expeditorsResponse.json()
        const expeditorsList = expeditorsData.results || expeditorsData
        const expeditorNames = Array.isArray(expeditorsList)
          ? expeditorsList.map((e: any) => e.name || e.ekispiditor_name).filter(Boolean)
          : []
        setFilterOptions(prev => ({ ...prev, expeditors: [...new Set(expeditorNames)] }))
        
        // Map expeditor names to checks
        const expeditorMap = new Map()
        if (Array.isArray(expeditorsList)) {
          expeditorsList.forEach((exp: any) => {
            const name = exp.name || exp.ekispiditor_name
            expeditorMap.set(name, exp)
          })
        }
        
        // Enrich checks with expeditor data
        const enrichedChecks = checksList.map(check => {
          const expeditorName = check.expeditor || check.ekispiditor
          if (expeditorName && expeditorMap.size > 0) {
            const expeditorData = Array.from(expeditorMap.values()).find(
              (e: any) => e.name === expeditorName || e.ekispiditor_name === expeditorName
            )
            return { ...check, expeditor_name: expeditorData ? (expeditorData.name || expeditorData.ekispiditor_name) : expeditorName }
          }
          return { ...check, expeditor_name: expeditorName || '-' }
        })
        
        // Set all checks with expeditor mapping
        setAllChecks(enrichedChecks)
      } else {
        // If expeditors fetch fails, just use the original checksList
        setAllChecks(checksList)
      }

      if (filialsResponse.ok) {
        const filialsData = await filialsResponse.json()
        const filialsList = filialsData.results || filialsData
        const filialNames = Array.isArray(filialsList)
          ? filialsList.map((f: any) => ({ id: f.id, name: f.filial_name || f.name })).filter((f: any) => f.name)
          : []
        setFilterOptions(prev => ({ ...prev, filials: filialNames }))
      }

      // Extract cities
      const cities = [...new Set(checks.filter((c: Check) => c.city).map((c: Check) => c.city!))]
      setFilterOptions(prev => ({ ...prev, cities }))

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
  }, [token, appliedFilters, sortField, sortOrder, currentPage, pageSize])

  useEffect(() => {
    if (token) fetchData()
  }, [token, fetchData])
  
  // Apply sorting and pagination to allChecks
  const sortedAndPaginatedChecks = useMemo(() => {
    // Sort checks
    const sorted = [...allChecks].sort((a: Check, b: Check) => {
      let valueA: any = ''
      let valueB: any = ''
      
      switch (sortField) {
        case 'date':
          valueA = new Date(a.yetkazilgan_vaqti || a.created_at || 0).getTime()
          valueB = new Date(b.yetkazilgan_vaqti || b.created_at || 0).getTime()
          break
        case 'summa':
          valueA = a.check_detail?.total_sum || 0
          valueB = b.check_detail?.total_sum || 0
          break
        case 'client':
          valueA = (a.client_name || '').toLowerCase()
          valueB = (b.client_name || '').toLowerCase()
          break
        case 'expeditor':
          valueA = ((a as any).expeditor_name || a.expeditor || '').toLowerCase()
          valueB = ((b as any).expeditor_name || b.expeditor || '').toLowerCase()
          break
      }
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    // Update total pages
    setTotalPages(Math.ceil(sorted.length / pageSize))
    
    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize
    return sorted.slice(startIndex, startIndex + pageSize)
  }, [allChecks, sortField, sortOrder, currentPage, pageSize])
  
  useEffect(() => {
    setChecks(sortedAndPaginatedChecks)
  }, [sortedAndPaginatedChecks])

  const handleCheckVerification = async (check: Check) => {
    try {
      setLoading(true)
      
      // Fetch check details from smartpos.uz via our API
      const response = await fetch('/api/check/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ check_id: check.check_id })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch check details')
      }
      
      // Merge smartpos data with our database data
      const details: CheckDetails = {
        ...data.details,
        'Check ID': check.check_id,
        'Mijoz': check.client_name,
        'Agent': check.agent || check.sborshik || '-',
        'Ekspiditor': check.expeditor || '-',
        'Proyekt': check.project || '-',
        'Shahar': check.city || '-',
      }
      
      // Add financial data if available
      if (check.check_detail?.total_sum) {
        details['Jami Summa (DB)'] = `${check.check_detail.total_sum.toLocaleString('uz-UZ')} UZS`
      }
      if (check.check_detail?.nalichniy) details['Naqd (DB)'] = `${check.check_detail.nalichniy.toLocaleString('uz-UZ')} UZS`
      if (check.check_detail?.uzcard) details['UzCard (DB)'] = `${check.check_detail.uzcard.toLocaleString('uz-UZ')} UZS`
      if (check.check_detail?.humo) details['Humo (DB)'] = `${check.check_detail.humo.toLocaleString('uz-UZ')} UZS`
      if (check.check_detail?.click) details['Click (DB)'] = `${check.check_detail.click.toLocaleString('uz-UZ')} UZS`
      
      details['GPS koordinatalar'] = check.check_lat && check.check_lon ? `${check.check_lat.toFixed(6)}, ${check.check_lon.toFixed(6)}` : '-'
      details['Yetkazilgan vaqti'] = check.yetkazilgan_vaqti ? format(new Date(check.yetkazilgan_vaqti), 'dd.MM.yyyy HH:mm') : '-'
      details['Status'] = check.status || '-'
      
      setCheckDetails(details)
      setSelectedCheck(check)
      setShowDetailsDialog(true)
      
      // Also open external link
      const externalUrl = `https://smartpos.uz/uz/proverka-cheka?uid=${check.check_id}`
      window.open(externalUrl, '_blank')
      
    } catch (error: any) {
      console.error('Error verifying check:', error)
      toast({
        title: 'Xatolik',
        description: error.message || 'Chekni tekshirishda xatolik',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Cheklar</h1>
                <p className="text-sm text-gray-500">Barcha cheklar ro'yxati va tekshirish</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <Button
                  onClick={() => setViewMode('cards')}
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                >
                  Cards
                </Button>
                <Button
                  onClick={() => setViewMode('table')}
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                >
                  Table
                </Button>
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filterlar
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
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    onBlur={() => setAppliedFilters({ ...filters })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Sanagacha</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    onBlur={() => setAppliedFilters({ ...filters })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Ekspiditor</Label>
                  <Select 
                    value={filters.expeditor || 'all'} 
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
                    value={filters.filial || 'all'} 
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
                  <Label className="text-xs">Shahar</Label>
                  <Select 
                    value={filters.city || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, city: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      {filterOptions.cities.map((city: string) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => {
                      const resetFilters = { dateFrom: '', dateTo: '', expeditor: '', filial: '', city: '', search: '' }
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
                    Qidirish
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Sort and Page Size */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Tartiblash:</Label>
              <Select 
                value={sortField} 
                onValueChange={(value) => setSortField(value as any)}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sana</SelectItem>
                  <SelectItem value="summa">Summa</SelectItem>
                  <SelectItem value="client">Mijoz</SelectItem>
                  <SelectItem value="expeditor">Ekspiditor</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="outline"
                size="sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs">Sahifada:</Label>
              <Select 
                value={String(pageSize)} 
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Checks Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checks.map((check) => (
              <Card key={check.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        {check.client_name || 'Noma\'lum mijoz'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        ID: {check.check_id}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCheckVerification(check)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {check.yetkazilgan_vaqti ? format(new Date(check.yetkazilgan_vaqti), 'dd.MM.yyyy HH:mm') : '-'}
                    </span>
                  </div>
                  
                  {check.agent && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Agent: {check.agent}</span>
                    </div>
                  )}
                  
                  {check.expeditor && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Ekspiditor: {check.expeditor}</span>
                    </div>
                  )}
                  
                  {check.project && (
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Proyekt: {check.project}</span>
                    </div>
                  )}
                  
                  {check.check_detail?.total_sum && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-600">
                        {check.check_detail.total_sum.toLocaleString('uz-UZ')} UZS
                      </span>
                    </div>
                  )}
                  
                  {check.status && (
                    <Badge variant={check.status === 'success' ? 'default' : 'destructive'}>
                      {check.status}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ekspiditor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vaqt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harakat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checks.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{check.check_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{check.client_name || 'Noma\'lum'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{check.agent || check.sborshik || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(check as any).expeditor_name || check.expeditor || check.ekispiditor || '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {check.check_detail?.total_sum ? `${check.check_detail.total_sum.toLocaleString('uz-UZ')} UZS` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {check.yetkazilgan_vaqti ? format(new Date(check.yetkazilgan_vaqti), 'dd.MM.yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckVerification(check)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {checks.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Cheklar topilmadi</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Oldingi
            </Button>
            <span className="text-sm text-gray-600">
              Sahifa {currentPage} / {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Keyingi
            </Button>
          </div>
        )}
      </div>

      {/* Check Details Dialog */}
      {selectedCheck && checkDetails && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Chek tafsilotlari - {selectedCheck.client_name}
              </DialogTitle>
              <DialogDescription>ID: {selectedCheck.check_id}</DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(checkDetails).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">{key}</div>
                    <div className="font-medium">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

