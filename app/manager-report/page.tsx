"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AlertCircle, Download, Mail, Filter, BarChart3, MapPin, Clock, Warehouse, Users, Search, ArrowUp, ArrowDown, SlidersHorizontal } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { api, analytics } from "@/lib/api"
import type { Project, Filial } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts"

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
    filial_statistics: Record<string, {
      same_location: number
      sklad: number
      same_time: number
      total_violations: number
      total_checks: number
    }>
    project_statistics: Record<string, {
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
  const [searchTerm, setSearchTerm] = useState("")
  const [showDetails, setShowDetails] = useState(false)
  const defaultLayout = [
    "charts_exp",
    "charts_fil_proj",
    "kpi",
    "violation_types",
    "violations",
    "exp_table",
    "fil_table",
    "proj_table",
  ]
  const [layoutOrder, setLayoutOrder] = useState<string[]>(defaultLayout)
  const [layoutHidden, setLayoutHidden] = useState<Record<string, boolean>>({})
  const [showLayoutSettings, setShowLayoutSettings] = useState(false)
  
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

    // Load saved layout
    try {
      const saved = localStorage.getItem("manager_report_layout")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.order) setLayoutOrder(parsed.order)
        if (parsed.hidden) setLayoutHidden(parsed.hidden)
      }
    } catch {}
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

  const saveLayout = useCallback((nextOrder: string[], nextHidden: Record<string, boolean>) => {
    setLayoutOrder(nextOrder)
    setLayoutHidden(nextHidden)
    try {
      localStorage.setItem(
        "manager_report_layout",
        JSON.stringify({ order: nextOrder, hidden: nextHidden }),
      )
    } catch {}
  }, [])

  const moveSection = useCallback(
    (id: string, direction: "up" | "down") => {
      setLayoutOrder((prev) => {
        const idx = prev.indexOf(id)
        if (idx === -1) return prev
        const target = direction === "up" ? idx - 1 : idx + 1
        if (target < 0 || target >= prev.length) return prev
        const next = [...prev]
        const tmp = next[idx]
        next[idx] = next[target]
        next[target] = tmp
        saveLayout(next, layoutHidden)
        return next
      })
    },
    [layoutHidden, saveLayout],
  )

  const toggleSection = useCallback(
    (id: string) => {
      const nextHidden = { ...layoutHidden, [id]: !layoutHidden[id] }
      saveLayout(layoutOrder, nextHidden)
    },
    [layoutHidden, layoutOrder, saveLayout],
  )

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

  // Sektsiyalarni render qilish
  const renderSection = (id: string) => {
    if (layoutHidden[id]) return null
    switch (id) {
      case "charts_exp":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Expeditorlar bo'yicha (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topExpeditors.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topExpeditors} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#2563eb" name="Jami xatoliklar">
                        <LabelList dataKey="total" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
              )}
            </CardContent>
          </Card>
        )
      case "charts_fil_proj":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Filial va Loyiha (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-64 w-full">
                  {topFilials.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topFilials} layout="vertical" margin={{ left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#0ea5e9" name="Jami xatoliklar">
                          <LabelList dataKey="total" position="right" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-gray-500">Filial bo'yicha ma'lumot yo'q</p>
                  )}
                </div>
                <div className="h-64 w-full">
                  {topProjects.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProjects} layout="vertical" margin={{ left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#f97316" name="Jami xatoliklar">
                          <LabelList dataKey="total" position="right" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-gray-500">Loyiha bo'yicha ma'lumot yo'q</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      case "kpi":
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Jami Xatoliklar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData?.statistics.total_violations ?? 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Tahlil qilingan checklar: {reportData?.statistics.total_checks_analyzed ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Xatoliklar ulushi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{(kpi?.violationRate || 0).toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">Jami checklarga nisbatan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Eng ko'p tur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-blue-600">{kpi?.dominantType || "—"}</div>
                <p className="text-xs text-gray-500 mt-1">Asosiy e'tibor qaratish kerak</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Top expeditor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-red-600">{kpi?.topOffender || "—"}</div>
                <p className="text-xs text-gray-500 mt-1">Ko'proq xatolik sodir etgan</p>
              </CardContent>
            </Card>
          </div>
        )
      case "violation_types":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Bitta Joydan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {reportData?.statistics.violation_types.same_location ?? 0}
                </div>
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
                <div className="text-3xl font-bold text-red-600">
                  {reportData?.statistics.violation_types.sklad ?? 0}
                </div>
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
                <div className="text-3xl font-bold text-blue-600">
                  {reportData?.statistics.violation_types.same_time ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "violations":
        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Xatoliklar</CardTitle>
                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Expeditor yoki check ID bo'yicha qidirish"
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant={showDetails ? "outline" : "default"}
                    onClick={() => setShowDetails((p) => !p)}
                  >
                    {showDetails ? "Detallarni yashirish" : "Detallarni ko'rsatish"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="same_location" className="w-full">
                <TabsList>
                  <TabsTrigger value="same_location">
                    Bitta Joydan ({reportData?.violations.same_location.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="sklad">
                    Skladdan ({reportData?.violations.sklad.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="same_time">
                    Bir Vaqtda ({reportData?.violations.same_time.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="same_location" className="mt-4">
                  <ViolationsTable
                    violations={filterViolations(reportData?.violations.same_location || [])}
                    type="same_location"
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                    showDetails={showDetails}
                  />
                </TabsContent>

                <TabsContent value="sklad" className="mt-4">
                  <ViolationsTable
                    violations={filterViolations(reportData?.violations.sklad || [])}
                    type="sklad"
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                    showDetails={showDetails}
                  />
                </TabsContent>

                <TabsContent value="same_time" className="mt-4">
                  <ViolationsTable
                    violations={filterViolations(reportData?.violations.same_time || [])}
                    type="same_time"
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                    showDetails={showDetails}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )
      case "exp_table":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Expeditorlar Bo'yicha Statistika
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topExpeditors.length > 0 && (
                <div className="h-64 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topExpeditors} layout="vertical" margin={{ left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#2563eb" name="Jami xatoliklar">
                        <LabelList dataKey="total" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                  {Object.entries(reportData?.statistics.expeditor_statistics || {}).map(([expeditor, stats]) => (
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
        )
      case "fil_table":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Filiallar bo'yicha statistika</CardTitle>
            </CardHeader>
            <CardContent>
              {topFilials.length > 0 && (
                <div className="h-64 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topFilials} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#0ea5e9" name="Jami xatoliklar">
                        <LabelList dataKey="total" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filial</TableHead>
                    <TableHead>Bitta Joydan</TableHead>
                    <TableHead>Skladdan</TableHead>
                    <TableHead>Bir Vaqtda</TableHead>
                    <TableHead>Jami</TableHead>
                    <TableHead>Checklar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(reportData?.statistics.filial_statistics || {}).map(([filial, stats]) => (
                    <TableRow key={filial}>
                      <TableCell className="font-medium">{filial}</TableCell>
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
        )
      case "proj_table":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Loyihalar bo'yicha statistika</CardTitle>
            </CardHeader>
            <CardContent>
              {topProjects.length > 0 && (
                <div className="h-64 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProjects} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#f97316" name="Jami xatoliklar">
                        <LabelList dataKey="total" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loyiha</TableHead>
                    <TableHead>Bitta Joydan</TableHead>
                    <TableHead>Skladdan</TableHead>
                    <TableHead>Bir Vaqtda</TableHead>
                    <TableHead>Jami</TableHead>
                    <TableHead>Checklar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(reportData?.statistics.project_statistics || {}).map(([project, stats]) => (
                    <TableRow key={project}>
                      <TableCell className="font-medium">{project}</TableCell>
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
        )
      default:
        return null
    }
  }

  // Top expeditors (violation ko'pchiligi) bar chart ma'lumotlari
  const topExpeditors = useMemo(() => {
    if (!reportData) return []
    const entries = Object.entries(reportData.statistics.expeditor_statistics)
    return entries
      .map(([name, stats]) => ({
        name,
        total: stats.total_violations,
        checks: stats.total_checks,
        same_location: stats.same_location,
        sklad: stats.sklad,
        same_time: stats.same_time,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [reportData])

  const topFilials = useMemo(() => {
    if (!reportData) return []
    const entries = Object.entries(reportData.statistics.filial_statistics || {})
    return entries
      .map(([name, stats]) => ({
        name,
        total: stats.total_violations,
        checks: stats.total_checks,
        same_location: stats.same_location,
        sklad: stats.sklad,
        same_time: stats.same_time,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [reportData])

  const topProjects = useMemo(() => {
    if (!reportData) return []
    const entries = Object.entries(reportData.statistics.project_statistics || {})
    return entries
      .map(([name, stats]) => ({
        name,
        total: stats.total_violations,
        checks: stats.total_checks,
        same_location: stats.same_location,
        sklad: stats.sklad,
        same_time: stats.same_time,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [reportData])

  // Violationsni qidirish bo'yicha filtrlash
  const filterViolations = useCallback(
    (items: Violation[]) => {
      const term = searchTerm.trim().toLowerCase()
      if (!term) return items
      return items.filter((v) => {
        const expMatch = v.expeditor?.toLowerCase().includes(term)
        const checkMatch = v.checks?.some(
          (c) =>
            c.check_id.toLowerCase().includes(term) ||
            (c.client_name || "").toLowerCase().includes(term),
        )
        return expMatch || checkMatch
      })
    },
    [searchTerm],
  )

  // Managerlar uchun qo'shimcha foydali ko'rsatkichlar
  const kpi = useMemo(() => {
    if (!reportData) return null
    const totalChecks = reportData.statistics.total_checks_analyzed || 0
    const totalViolations = reportData.statistics.total_violations || 0
    const violationRate = totalChecks > 0 ? (totalViolations / totalChecks) * 100 : 0
    const expCount = Object.keys(reportData.statistics.expeditor_statistics || {}).length || 1
    const avgPerExp = totalViolations / expCount
    const vt = reportData.statistics.violation_types
    const dominantTypeEntry = Object.entries(vt).sort((a, b) => b[1] - a[1])[0]
    const dominantType =
      dominantTypeEntry?.[0] === "same_location"
        ? "Bitta joydan"
        : dominantTypeEntry?.[0] === "sklad"
        ? "Skladdan"
        : "Bir vaqtda"
    const topOffender = topExpeditors[0]?.name || "—"

    return {
      violationRate,
      avgPerExp,
      dominantType,
      topOffender,
    }
  }, [reportData, topExpeditors])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Manager Xisoboti</h1>
              <p className="text-gray-600 mt-1">Xatoliklar va statistika tahlili</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                variant={showLayoutSettings ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLayoutSettings((p) => !p)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Layout sozlash
              </Button>
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

          {showLayoutSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Layout sozlash (ko'rsatish/yashirish va tartib)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {layoutOrder.map((id) => (
                    <div key={id} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!layoutHidden[id]}
                          onChange={() => toggleSection(id)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium">
                          {id === "charts_exp"
                            ? "Top Expeditor diagramma"
                            : id === "charts_fil_proj"
                            ? "Filial/Loyiha diagrammalari"
                            : id === "kpi"
                            ? "KPI kartalar"
                            : id === "violation_types"
                            ? "Xatolik turlari kartalari"
                            : id === "violations"
                            ? "Xatoliklar (tabs)"
                            : id === "exp_table"
                            ? "Expeditor jadvali"
                            : id === "fil_table"
                            ? "Filial jadvali"
                            : id === "proj_table"
                            ? "Loyiha jadvali"
                            : id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => moveSection(id, "up")}
                          disabled={layoutOrder.indexOf(id) === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => moveSection(id, "down")}
                          disabled={layoutOrder.indexOf(id) === layoutOrder.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          {reportData && (
            <>
              {/* Dinamik tartib va ko'rinish */}
              <div className="space-y-4">
                {layoutOrder.map((id) => (
                  <div key={id}>{renderSection(id)}</div>
                ))}
              </div>

              {/* Violations Tabs */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle>Xatoliklar</CardTitle>
                    <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
                      <div className="relative w-full md:w-64">
                        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="Expeditor yoki check ID bo'yicha qidirish"
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button
                        variant={showDetails ? "outline" : "default"}
                        onClick={() => setShowDetails((p) => !p)}
                      >
                        {showDetails ? "Detallarni yashirish" : "Detallarni ko'rsatish"}
                      </Button>
                    </div>
                  </div>
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
                        violations={filterViolations(reportData.violations.same_location)}
                        type="same_location"
                        formatCurrency={formatCurrency}
                        formatDateTime={formatDateTime}
                        showDetails={showDetails}
                      />
                    </TabsContent>

                    <TabsContent value="sklad" className="mt-4">
                      <ViolationsTable
                        violations={filterViolations(reportData.violations.sklad)}
                        type="sklad"
                        formatCurrency={formatCurrency}
                        formatDateTime={formatDateTime}
                        showDetails={showDetails}
                      />
                    </TabsContent>

                    <TabsContent value="same_time" className="mt-4">
                      <ViolationsTable
                        violations={filterViolations(reportData.violations.same_time)}
                        type="same_time"
                        formatCurrency={formatCurrency}
                        formatDateTime={formatDateTime}
                        showDetails={showDetails}
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
                  {topExpeditors.length > 0 && (
                    <div className="h-64 w-full mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topExpeditors} layout="vertical" margin={{ left: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} />
                          <Tooltip />
                          <Bar dataKey="total" fill="#2563eb" name="Jami xatoliklar">
                            <LabelList dataKey="total" position="right" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Filiallar bo'yicha statistika</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topFilials.length > 0 && (
                      <div className="h-64 w-full mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topFilials} layout="vertical" margin={{ left: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={140} />
                            <Tooltip />
                            <Bar dataKey="total" fill="#0ea5e9" name="Jami xatoliklar">
                              <LabelList dataKey="total" position="right" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filial</TableHead>
                          <TableHead>Bitta Joydan</TableHead>
                          <TableHead>Skladdan</TableHead>
                          <TableHead>Bir Vaqtda</TableHead>
                          <TableHead>Jami</TableHead>
                          <TableHead>Checklar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportData?.statistics.filial_statistics || {}).map(([filial, stats]) => (
                          <TableRow key={filial}>
                            <TableCell className="font-medium">{filial}</TableCell>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Loyihalar bo'yicha statistika</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topProjects.length > 0 && (
                      <div className="h-64 w-full mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topProjects} layout="vertical" margin={{ left: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={140} />
                            <Tooltip />
                            <Bar dataKey="total" fill="#f97316" name="Jami xatoliklar">
                              <LabelList dataKey="total" position="right" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loyiha</TableHead>
                          <TableHead>Bitta Joydan</TableHead>
                          <TableHead>Skladdan</TableHead>
                          <TableHead>Bir Vaqtda</TableHead>
                          <TableHead>Jami</TableHead>
                          <TableHead>Checklar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportData?.statistics.project_statistics || {}).map(([project, stats]) => (
                          <TableRow key={project}>
                            <TableCell className="font-medium">{project}</TableCell>
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
              </div>
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

function ViolationsTable({ violations, type, formatCurrency, formatDateTime, showDetails }: {
  violations: Violation[]
  type: string
  formatCurrency: (amount: number) => string
  formatDateTime: (iso: string) => string
  showDetails: boolean
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
            {showDetails ? (
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
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">Checklar: {violation.check_count} ta</p>
                <p className="truncate">
                  IDs: {violation.checks.map((c) => c.check_id).slice(0, 5).join(", ")}
                  {violation.checks.length > 5 && " ..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

