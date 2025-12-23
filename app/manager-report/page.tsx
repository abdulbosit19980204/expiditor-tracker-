"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AlertCircle, Download, Mail, Filter, BarChart3, MapPin, Clock, Warehouse, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { api, analytics } from "@/lib/api"
import type { Project, Filial } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Violation {
  type: string
  expeditor: string
  check_count: number
  checks: Array<{
    check_id: string
    client_name: string
    lat: number
    lon: number
    time: string
    project: string
    total_sum: number
    distance_from_sklad?: number
  }>
  center_lat?: number
  center_lon?: number
  radius_meters?: number
  sklad_name?: string
  sklad_lat?: number
  sklad_lon?: number
  time_window_start?: string
  time_window_end?: string
  duration_minutes?: number
  time_window_minutes?: number
}

interface ManagerReportData {
  filters: {
    date_from: string
    date_to: string
    filial_id: string | null
    project: string | null
    radius_meters: number
    time_window_minutes: number
  }
  statistics: {
    total_violations: number
    violation_types: {
      same_location: number
      sklad: number
      same_time: number
    }
    expeditor_statistics: Record<string, {
      same_location: number
      sklad: number
      same_time: number
      total_violations: number
      total_checks: number
    }>
    total_checks_analyzed: number
  }
  violations: {
    same_location: Violation[]
    sklad: Violation[]
    same_time: Violation[]
  }
}

function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { from: firstDay, to: lastDay }
}

export default function ManagerReportPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ManagerReportData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [filials, setFilials] = useState<Filial[]>([])
  
  const [filters, setFilters] = useState({
    dateRange: getCurrentMonthRange(),
    filial: "",
    project: "",
    radius_meters: 10,
    time_window_minutes: 5,
  })

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [projectsData, filialsData] = await Promise.all([
          api.getProjects(),
          api.getFilials(),
        ])
        setProjects(projectsData)
        setFilials(filialsData)
      } catch (error) {
        console.error("Error loading initial data:", error)
      }
    }
    loadInitialData()
  }, [])

  const loadReport = useCallback(async () => {
    if (!filters.dateRange.from || !filters.dateRange.to) {
      toast({
        title: "Xatolik",
        description: "Sana oralig'ini tanlang",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const data = await analytics.getManagerReport({
        date_from: filters.dateRange.from.toISOString(),
        date_to: filters.dateRange.to.toISOString(),
        filial: filters.filial || undefined,
        project: filters.project || undefined,
        radius_meters: filters.radius_meters,
        time_window_minutes: filters.time_window_minutes,
      })

      if (data) {
        setReportData(data)
      } else {
        toast({
          title: "Xatolik",
          description: "Xisobot yuklanmadi",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading report:", error)
      toast({
        title: "Xatolik",
        description: "Xisobot yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filters])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " UZS"
  }

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  const exportToPDF = async () => {
    if (!filters.dateRange.from || !filters.dateRange.to) {
      toast({
        title: "Xatolik",
        description: "Sana oralig'ini tanlang",
        variant: "destructive",
      })
      return
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"
      const params = new URLSearchParams({
        date_from: filters.dateRange.from.toISOString(),
        date_to: filters.dateRange.to.toISOString(),
        radius_meters: filters.radius_meters.toString(),
        time_window_minutes: filters.time_window_minutes.toString(),
      })
      
      if (filters.filial) params.append('filial', filters.filial)
      if (filters.project) params.append('project', filters.project)

      const url = `${API_BASE_URL}/manager-report/pdf/?${params.toString()}`
      window.open(url, '_blank')
      
      toast({
        title: "Muvaffaqiyatli",
        description: "PDF yuklanmoqda...",
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "PDF exportda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const sendEmail = async () => {
    if (!filters.dateRange.from || !filters.dateRange.to) {
      toast({
        title: "Xatolik",
        description: "Sana oralig'ini tanlang",
        variant: "destructive",
      })
      return
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/manager-report/email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Token ${token}` })
        },
        body: JSON.stringify({
          date_from: filters.dateRange.from.toISOString(),
          date_to: filters.dateRange.to.toISOString(),
          filial: filters.filial || undefined,
          project: filters.project || undefined,
          radius_meters: filters.radius_meters,
          time_window_minutes: filters.time_window_minutes,
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Muvaffaqiyatli",
          description: data.message || "Xisobot emailga yuborildi",
        })
      } else {
        toast({
          title: "Xatolik",
          description: data.error || "Email yuborishda xatolik",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Email yuborishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manager Xisoboti</h1>
              <p className="text-gray-600 mt-1">Xatoliklar va statistika tahlili</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                PDF Export
              </Button>
              <Button onClick={sendEmail} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email Yuborish
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filterlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Sana Oralig'i</Label>
                  <DatePickerWithRange
                    dateRange={filters.dateRange}
                    onDateRangeChange={(range) => setFilters(prev => ({ ...prev, dateRange: range || getCurrentMonthRange() }))}
                  />
                </div>

                <div>
                  <Label>Filial</Label>
                  <Select
                    value={filters.filial || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, filial: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Barcha filiallar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha filiallar</SelectItem>
                      {filials.map((filial) => (
                        <SelectItem key={filial.id} value={String(filial.id)}>
                          {filial.filial_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Loyiha</Label>
                  <Select
                    value={filters.project || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, project: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Barcha loyihalar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha loyihalar</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.project_name}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Radius (metr)</Label>
                  <Input
                    type="number"
                    value={filters.radius_meters}
                    onChange={(e) => setFilters(prev => ({ ...prev, radius_meters: Number(e.target.value) }))}
                    min={1}
                    max={100}
                  />
                </div>

                <div>
                  <Label>Vaqt Oynasi (daqiqa)</Label>
                  <Input
                    type="number"
                    value={filters.time_window_minutes}
                    onChange={(e) => setFilters(prev => ({ ...prev, time_window_minutes: Number(e.target.value) }))}
                    min={1}
                    max={60}
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={loadReport} className="w-full" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" /> : "Xisobotni Yuklash"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {reportData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Jami Xatoliklar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reportData.statistics.total_violations}</div>
                    <p className="text-xs text-gray-500 mt-1">Tahlil qilingan checklar: {reportData.statistics.total_checks_analyzed}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Bitta Joydan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{reportData.statistics.violation_types.same_location}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Skladdan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{reportData.statistics.violation_types.sklad}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Bir Vaqtda
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{reportData.statistics.violation_types.same_time}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Violations Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Xatoliklar Tafsilotlari</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="same_location" className="w-full">
                    <TabsList>
                      <TabsTrigger value="same_location">
                        Bitta Joydan ({reportData.violations.same_location.length})
                      </TabsTrigger>
                      <TabsTrigger value="sklad">
                        Skladdan ({reportData.violations.sklad.length})
                      </TabsTrigger>
                      <TabsTrigger value="same_time">
                        Bir Vaqtda ({reportData.violations.same_time.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="same_location" className="mt-4">
                      <ViolationsTable
                        violations={reportData.violations.same_location}
                        type="same_location"
                        formatCurrency={formatCurrency}
                        formatDateTime={formatDateTime}
                      />
                    </TabsContent>

                    <TabsContent value="sklad" className="mt-4">
                      <ViolationsTable
                        violations={reportData.violations.sklad}
                        type="sklad"
                        formatCurrency={formatCurrency}
                        formatDateTime={formatDateTime}
                      />
                    </TabsContent>

                    <TabsContent value="same_time" className="mt-4">
                      <ViolationsTable
                        violations={reportData.violations.same_time}
                        type="same_time"
                        formatCurrency={formatCurrency}
                        formatDateTime={formatDateTime}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Expeditor Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Expeditorlar Bo'yicha Statistika
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expeditor</TableHead>
                        <TableHead>Bitta Joydan</TableHead>
                        <TableHead>Skladdan</TableHead>
                        <TableHead>Bir Vaqtda</TableHead>
                        <TableHead>Jami Xatoliklar</TableHead>
                        <TableHead>Jami Checklar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(reportData.statistics.expeditor_statistics).map(([expeditor, stats]) => (
                        <TableRow key={expeditor}>
                          <TableCell className="font-medium">{expeditor}</TableCell>
                          <TableCell>{stats.same_location}</TableCell>
                          <TableCell>{stats.sklad}</TableCell>
                          <TableCell>{stats.same_time}</TableCell>
                          <TableCell className="font-bold">{stats.total_violations}</TableCell>
                          <TableCell>{stats.total_checks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!reportData && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Xisobotni yuklash uchun filterlarni to'ldiring va "Xisobotni Yuklash" tugmasini bosing</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

function ViolationsTable({ violations, type, formatCurrency, formatDateTime }: {
  violations: Violation[]
  type: string
  formatCurrency: (amount: number) => string
  formatDateTime: (iso: string) => string
}) {
  if (violations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Xatoliklar topilmadi
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {violations.map((violation, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {violation.expeditor} - {violation.check_count} ta check
              </CardTitle>
              <Badge variant="destructive">{violation.check_count} xatolik</Badge>
            </div>
            {violation.sklad_name && (
              <p className="text-sm text-gray-600">Sklad: {violation.sklad_name}</p>
            )}
            {violation.time_window_start && (
              <p className="text-sm text-gray-600">
                Vaqt: {formatDateTime(violation.time_window_start)} - {formatDateTime(violation.time_window_end || "")}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check ID</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Vaqt</TableHead>
                  <TableHead>Loyiha</TableHead>
                  <TableHead>Summa</TableHead>
                  {type === "sklad" && <TableHead>Masofa (m)</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {violation.checks.map((check) => (
                  <TableRow key={check.check_id}>
                    <TableCell className="font-mono text-sm">{check.check_id}</TableCell>
                    <TableCell>{check.client_name || "-"}</TableCell>
                    <TableCell>{formatDateTime(check.time)}</TableCell>
                    <TableCell>{check.project}</TableCell>
                    <TableCell>{formatCurrency(check.total_sum)}</TableCell>
                    {type === "sklad" && (
                      <TableCell>{check.distance_from_sklad?.toFixed(2) || "-"}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

