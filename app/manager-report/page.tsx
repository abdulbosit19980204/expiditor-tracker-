"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AlertCircle, Download, Mail, Filter, BarChart3, MapPin, Clock, Warehouse, Users, Search, ArrowUp, ArrowDown, SlidersHorizontal, RotateCcw, Eye, EyeOff, FileText, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

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
      filial_name?: string
      project_name?: string
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
    violation_rate?: number
    dominant_violation_type?: string
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

const DEFAULT_LAYOUT = [
  "charts_exp",
  "charts_fil_proj",
  "kpi",
  "violation_types",
  "violations",
  "exp_table",
  "fil_table",
  "proj_table",
]

const SECTION_NAMES: Record<string, string> = {
  charts_exp: "section_top_expeditor",
  charts_fil_proj: "section_filial_project",
  kpi: "section_kpi",
  violation_types: "section_violation_types",
  violations: "section_violations",
  exp_table: "section_expeditor_table",
  fil_table: "section_filial_table",
  proj_table: "section_project_table",
}

export default function ManagerReportPage() {
  const { token } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ManagerReportData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [filials, setFilials] = useState<Filial[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showDetails, setShowDetails] = useState(false)
  const [layoutOrder, setLayoutOrder] = useState<string[]>(DEFAULT_LAYOUT)
  const [layoutHidden, setLayoutHidden] = useState<Record<string, boolean>>({})
  const [showLayoutDialog, setShowLayoutDialog] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
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
        if (parsed.order && Array.isArray(parsed.order)) {
          setLayoutOrder(parsed.order.filter((id: string) => DEFAULT_LAYOUT.includes(id)))
        }
        if (parsed.hidden && typeof parsed.hidden === 'object') {
          setLayoutHidden(parsed.hidden)
        }
      }
    } catch (e) {
      console.error("Error loading saved layout:", e)
    }
  }, [])

  const loadReport = useCallback(async () => {
    if (!filters.dateRange.from || !filters.dateRange.to) {
      toast({
        title: t('error'),
        description: t('date_range_required'),
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
        toast({
          title: t('success'),
          description: t('report_loaded'),
        })
      } else {
        toast({
          title: t('error'),
          description: t('report_load_error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading report:", error)
      toast({
        title: t('error'),
        description: t('report_load_error'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filters, t])

  const saveLayout = useCallback((nextOrder: string[], nextHidden: Record<string, boolean>) => {
    setLayoutOrder(nextOrder)
    setLayoutHidden(nextHidden)
    try {
      localStorage.setItem(
        "manager_report_layout",
        JSON.stringify({ order: nextOrder, hidden: nextHidden }),
      )
    } catch (e) {
      console.error("Error saving layout:", e)
    }
  }, [])

  const resetLayout = useCallback(() => {
    setLayoutOrder(DEFAULT_LAYOUT)
    setLayoutHidden({})
    saveLayout(DEFAULT_LAYOUT, {})
    setShowResetConfirm(false)
    setShowLayoutDialog(false)
    toast({
      title: t('success'),
      description: t('layout_reset_success'),
    })
  }, [saveLayout, t])

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
    return new Intl.NumberFormat("uz-UZ", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " " + t('uzs')
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
        title: t('error'),
        description: t('date_range_required'),
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
        title: t('success'),
        description: t('pdf_loading'),
      })
    } catch (error) {
      toast({
        title: t('error'),
        description: t('report_load_error'),
        variant: "destructive",
      })
    }
  }

  const sendEmail = async () => {
    if (!filters.dateRange.from || !filters.dateRange.to) {
      toast({
        title: t('error'),
        description: t('date_range_required'),
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
          title: t('success'),
          description: data.message || t('report_loaded'),
        })
      } else {
        toast({
          title: t('error'),
          description: data.error || t('report_load_error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('report_load_error'),
        variant: "destructive",
      })
    }
  }

  // Top expeditors (violation ko'pchiligi) bar chart ma'lumotlari
  const topExpeditors = useMemo(() => {
    if (!reportData) return []
    const entries = Object.entries(reportData.statistics.expeditor_statistics || {})
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
        ? t('same_location')
        : dominantTypeEntry?.[0] === "sklad"
        ? t('from_warehouse')
        : t('same_time')
    const topOffender = topExpeditors[0]?.name || "—"

    return {
      violationRate,
      avgPerExp,
      dominantType,
      topOffender,
    }
  }, [reportData, topExpeditors, t])

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
                {t('top_expeditors_chart')}
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
                      <Bar dataKey="total" fill="#2563eb" name={t('total_violations_col')}>
                        <LabelList dataKey="total" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('no_data')}</p>
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
                {t('filial_project_chart')}
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
                        <Bar dataKey="total" fill="#0ea5e9" name={t('total_violations_col')}>
                          <LabelList dataKey="total" position="right" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-gray-500">{t('filial_no_data')}</p>
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
                        <Bar dataKey="total" fill="#f97316" name={t('total_violations_col')}>
                          <LabelList dataKey="total" position="right" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-gray-500">{t('project_no_data')}</p>
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
                <CardTitle className="text-sm font-medium text-gray-600">{t('total_violations')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData?.statistics.total_violations ?? 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('analyzed_checks')}: {reportData?.statistics.total_checks_analyzed ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">{t('violation_rate')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{(kpi?.violationRate || 0).toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">{t('relative_to_total')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">{t('dominant_type')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-blue-600">{kpi?.dominantType || "—"}</div>
                <p className="text-xs text-gray-500 mt-1">{t('focus_area')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">{t('top_violator')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-red-600">{kpi?.topOffender || "—"}</div>
                <p className="text-xs text-gray-500 mt-1">{t('most_violations')}</p>
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
                  {t('same_location')}
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
                  {t('from_warehouse')}
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
                  {t('same_time')}
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
                <CardTitle>{t('violations')}</CardTitle>
                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder={t('search_expeditor_check')}
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant={showDetails ? "outline" : "default"}
                    onClick={() => setShowDetails((p) => !p)}
                  >
                    {showDetails ? t('hide_details') : t('show_details')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="same_location" className="w-full">
                <TabsList>
                  <TabsTrigger value="same_location">
                    {t('same_location_tab')} ({reportData?.violations.same_location.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="sklad">
                    {t('from_warehouse_tab')} ({reportData?.violations.sklad.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="same_time">
                    {t('same_time_tab')} ({reportData?.violations.same_time.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="same_location" className="mt-4">
                  <ViolationsTable
                    violations={filterViolations(reportData?.violations.same_location || [])}
                    type="same_location"
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                    showDetails={showDetails}
                    t={t}
                  />
                </TabsContent>

                <TabsContent value="sklad" className="mt-4">
                  <ViolationsTable
                    violations={filterViolations(reportData?.violations.sklad || [])}
                    type="sklad"
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                    showDetails={showDetails}
                    t={t}
                  />
                </TabsContent>

                <TabsContent value="same_time" className="mt-4">
                  <ViolationsTable
                    violations={filterViolations(reportData?.violations.same_time || [])}
                    type="same_time"
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                    showDetails={showDetails}
                    t={t}
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
                {t('expeditor_statistics')}
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
                      <Bar dataKey="total" fill="#2563eb" name={t('total_violations_col')}>
                        <LabelList dataKey="total" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('expeditor_col')}</TableHead>
                    <TableHead>{t('same_location_col')}</TableHead>
                    <TableHead>{t('from_warehouse_col')}</TableHead>
                    <TableHead>{t('same_time_col')}</TableHead>
                    <TableHead>{t('total_violations_col')}</TableHead>
                    <TableHead>{t('total_checks_col')}</TableHead>
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
              <CardTitle>{t('filial_statistics')}</CardTitle>
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
                      <Bar dataKey="total" fill="#0ea5e9" name={t('total_violations_col')}>
                        <LabelList dataKey="total" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('filial_col')}</TableHead>
                    <TableHead>{t('same_location_col')}</TableHead>
                    <TableHead>{t('from_warehouse_col')}</TableHead>
                    <TableHead>{t('same_time_col')}</TableHead>
                    <TableHead>{t('total_col')}</TableHead>
                    <TableHead>{t('checks_col')}</TableHead>
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
              <CardTitle>{t('project_statistics')}</CardTitle>
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
                      <Bar dataKey="total" fill="#f97316" name={t('total_violations_col')}>
                        <LabelList dataKey="total" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('project_col')}</TableHead>
                    <TableHead>{t('same_location_col')}</TableHead>
                    <TableHead>{t('from_warehouse_col')}</TableHead>
                    <TableHead>{t('same_time_col')}</TableHead>
                    <TableHead>{t('total_col')}</TableHead>
                    <TableHead>{t('checks_col')}</TableHead>
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">{t('manager_report')}</h1>
              <p className="text-gray-600 mt-1">{t('manager_report_desc')}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLayoutDialog(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {t('layout_settings')}
              </Button>
              <Button onClick={exportToPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('pdf_export')}
              </Button>
              <Button onClick={sendEmail} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                {t('email_send')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('filters')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>{t('date_range')}</Label>
                  <DatePickerWithRange
                    dateRange={filters.dateRange}
                    onDateRangeChange={(range) => setFilters(prev => ({ ...prev, dateRange: range || getCurrentMonthRange() }))}
                  />
                </div>

                <div>
                  <Label>{t('filial')}</Label>
                  <Select
                    value={filters.filial || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, filial: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('all_filials')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_filials')}</SelectItem>
                      {filials.map((filial) => (
                        <SelectItem key={filial.id} value={String(filial.id)}>
                          {filial.filial_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('project')}</Label>
                  <Select
                    value={filters.project || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, project: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('all_projects')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_projects')}</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.project_name}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('radius_meters')}</Label>
                  <Input
                    type="number"
                    value={filters.radius_meters}
                    onChange={(e) => setFilters(prev => ({ ...prev, radius_meters: Number(e.target.value) }))}
                    min={1}
                    max={100}
                  />
                </div>

                <div>
                  <Label>{t('time_window')}</Label>
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
                    {loading ? <LoadingSpinner size="sm" /> : t('load_report')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout Settings Dialog */}
          <Dialog open={showLayoutDialog} onOpenChange={setShowLayoutDialog}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('layout_settings_title')}</DialogTitle>
                <DialogDescription>
                  {t('layout_settings')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                {layoutOrder.map((id, idx) => (
                  <div key={id} className="flex items-center justify-between border rounded-md px-3 py-3 gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Switch
                        checked={!layoutHidden[id]}
                        onCheckedChange={() => toggleSection(id)}
                      />
                      <div className="flex items-center gap-2">
                        {layoutHidden[id] ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-sm font-medium">
                          {t(SECTION_NAMES[id] || id)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => moveSection(id, "up")}
                        disabled={idx === 0}
                        title={t('move_up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => moveSection(id, "down")}
                        disabled={idx === layoutOrder.length - 1}
                        title={t('move_down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => setShowResetConfirm(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('reset_layout')}
                </Button>
                <Button onClick={() => setShowLayoutDialog(false)}>
                  {t('close')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reset Confirm Dialog */}
          <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('reset_layout')}</DialogTitle>
                <DialogDescription>
                  {t('reset_layout_confirm')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                  {t('cancel')}
                </Button>
                <Button variant="destructive" onClick={resetLayout}>
                  {t('reset_layout')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Statistics - Dynamic Layout */}
          {reportData && (
            <div className="space-y-4">
              {layoutOrder.map((id) => (
                <div key={id}>{renderSection(id)}</div>
              ))}
            </div>
          )}

          {!reportData && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">{t('load_report_prompt')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

function ViolationsTable({ violations, type, formatCurrency, formatDateTime, showDetails, t }: {
  violations: Violation[]
  type: string
  formatCurrency: (amount: number) => string
  formatDateTime: (iso: string) => string
  showDetails: boolean
  t: (key: string) => string
}) {
  if (violations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('violations_not_found')}
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
                {violation.expeditor} - {violation.check_count} {t('checks_count_display')}
              </CardTitle>
              <Badge variant="destructive">{violation.check_count} {t('violations_short')}</Badge>
            </div>
            {violation.sklad_name && (
              <p className="text-sm text-gray-600">{t('warehouse_name')}: {violation.sklad_name}</p>
            )}
            {violation.time_window_start && (
              <p className="text-sm text-gray-600">
                {t('time_range')}: {formatDateTime(violation.time_window_start)} - {formatDateTime(violation.time_window_end || "")}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {showDetails ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('check_id_col')}</TableHead>
                    <TableHead>{t('client_col')}</TableHead>
                    <TableHead>{t('time_col')}</TableHead>
                    <TableHead>{t('project_col')}</TableHead>
                    <TableHead>{t('amount_col')}</TableHead>
                    {type === "sklad" && <TableHead>{t('distance_m_col')}</TableHead>}
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
                <p className="font-medium">{t('checks_col')}: {violation.check_count} {t('checks_count_display')}</p>
                <p className="truncate">
                  {t('check_ids_preview')}: {violation.checks.map((c) => c.check_id).slice(0, 5).join(", ")}
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
