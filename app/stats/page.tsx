"use client"

import React, { useState, useCallback, useEffect, useMemo, Suspense } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Home, TrendingUp, Download, Search } from "lucide-react"
import type { Statistics, Project, Sklad, City } from "@/lib/types"
import { api } from "@/lib/api"

function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: firstDay, to: lastDay }
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// CSV Export function
const exportToCSV = (stats: Statistics, filters: any) => {
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
    ['', ''],
    ['Top Expeditors', ''],
    ...stats.topExpeditors.map(exp => [exp.name, exp.checkCount]),
    ['', ''],
    ['Top Projects', ''],
    ...stats.topProjects.map(proj => [proj.name, proj.checkCount]),
    ['', ''],
    ['Top Cities', ''],
    ...stats.topCities.map(city => [city.name, city.checkCount]),
    ['', ''],
    ['Top Warehouses', ''],
    ...(stats.topSklads || []).map(sklad => [sklad.name, sklad.checkCount]),
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

const StatsPageContent = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(getCurrentMonthRange())
  const [project, setProject] = useState("")
  const [sklad, setSklad] = useState("")
  const [city, setCity] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Statistics | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [projSearch, setProjSearch] = useState("")
  const [skladSearch, setSkladSearch] = useState("")
  const [citySearch, setCitySearch] = useState("")

  // Debounced filters for better performance
  const debouncedProject = useDebounce(project, 300)
  const debouncedSklad = useDebounce(sklad, 300)
  const debouncedCity = useDebounce(city, 300)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const filters = { dateRange, project: debouncedProject, sklad: debouncedSklad, city: debouncedCity, status }
      const data = await api.getGlobalStatistics(filters)
      setStats(data)
    } catch (e) {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [dateRange, debouncedProject, debouncedSklad, debouncedCity, status])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [proj, skl, cts] = await Promise.all([api.getProjects(), api.getSklads(), api.getCities()])
        setProjects(proj)
        setSklads(skl)
        setCities(cts)
      } catch {}
    }
    loadMeta()
  }, [])

  const formatNumber = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n || 0))

  // Filtered options for searchable selects
  const filteredProjects = useMemo(() => {
    if (!projSearch) return projects
    return projects.filter(p => p.project_name.toLowerCase().includes(projSearch.toLowerCase()))
  }, [projects, projSearch])

  const filteredSklads = useMemo(() => {
    if (!skladSearch) return sklads
    return sklads.filter(s => s.sklad_name.toLowerCase().includes(skladSearch.toLowerCase()))
  }, [sklads, skladSearch])

  const filteredCities = useMemo(() => {
    if (!citySearch) return cities
    return cities.filter(c => c.city_name.toLowerCase().includes(citySearch.toLowerCase()))
  }, [cities, citySearch])

  const handleExport = () => {
    if (stats) {
      exportToCSV(stats, { dateRange, project, sklad, city, status })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Global Statistics
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm px-3 py-2 border rounded-md hover:bg-gray-50"
            >
              <Home className="h-4 w-4" /> Home
            </Link>
            <Button variant="outline" onClick={loadStats} disabled={loading}>
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!stats}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                <DatePickerWithRange
                  dateRange={dateRange}
                  onDateRangeChange={(r) => setDateRange(r || getCurrentMonthRange())}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Project</label>
                <Select value={project || "all"} onValueChange={(value) => setProject(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {filteredProjects.map((p) => (
                      <SelectItem key={p.id} value={p.project_name}>
                        {p.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Warehouse</label>
                <Select value={sklad || "all"} onValueChange={(value) => setSklad(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All warehouses</SelectItem>
                    {filteredSklads.map((s) => (
                      <SelectItem key={s.id} value={s.sklad_name}>
                        {s.sklad_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
                <Select value={city || "all"} onValueChange={(value) => setCity(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cities</SelectItem>
                    {filteredCities.map((c) => (
                      <SelectItem key={c.id} value={c.city_name}>
                        {c.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="delivered">Delivered</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600">Loading statistics…</span>
          </div>
        ) : !stats ? (
          <div className="text-center text-gray-500 py-20">No statistics available</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-3">
              <CardContent className="p-4 md:p-6">
                <h2 className="font-semibold mb-4">Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <Metric label="Total Checks" value={formatNumber(stats.totalChecks)} />
                  <Metric label="Delivered" value={formatNumber(stats.deliveredChecks)} />
                  <Metric label="Pending" value={formatNumber(stats.pendingChecks)} />
                  <Metric label="Failed" value={formatNumber(stats.failedChecks)} />
                  <Metric label="Total Sum (UZS)" value={formatNumber(stats.totalSum)} />
                  <Metric label="Avg Check (UZS)" value={formatNumber(stats.avgCheckSum || 0)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Payment Breakdown</h3>
                <List
                  items={[
                    { label: "Cash", value: stats.paymentMethods.nalichniy },
                    { label: "UzCard", value: stats.paymentMethods.uzcard },
                    { label: "Humo", value: stats.paymentMethods.humo },
                    { label: "Click", value: stats.paymentMethods.click },
                  ]}
                  format={formatNumber}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Top Projects</h3>
                <List
                  items={(stats.topProjects || []).map((p) => ({ label: p.name, value: p.checkCount }))}
                  format={formatNumber}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Top Cities</h3>
                <List
                  items={(stats.topCities || []).map((c) => ({ label: c.name, value: c.checkCount }))}
                  format={formatNumber}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Top Warehouses</h3>
                <List
                  items={(stats.topSklads || []).map((s) => ({ label: s.name, value: s.checkCount }))}
                  format={formatNumber}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Daily Checks</h3>
                <LineChart
                  data={(stats.dailyStats || []).map((d) => ({ x: new Date(d.date).getTime(), y: d.checks }))}
                  height={140}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Hourly Distribution</h3>
                <BarChart
                  data={(stats.hourlyStats || []).map((h) => ({
                    label: String(new Date(h.hour).getHours()),
                    value: h.checks,
                  }))}
                  height={140}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Weekday Distribution</h3>
                <BarChart
                  data={(stats.dowStats || []).map((d) => ({ label: dowLabel(d.dow), value: d.checks }))}
                  height={140}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded border bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

function List({ items, format }: { items: { label: string; value: number }[]; format: (n: number) => string }) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">No data</div>
      ) : (
        items.map((i) => (
          <div key={i.label} className="flex justify-between text-sm">
            <span className="truncate mr-2">{i.label || "-"}</span>
            <Badge variant="outline">{format(i.value)}</Badge>
          </div>
        ))
      )}
    </div>
  )
}

function BarChart({ data, height = 120 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value || 0))
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} className="bg-white border rounded">
      {data.map((d, i) => {
        const bw = 100 / Math.max(1, data.length)
        const x = i * bw + bw * 0.1
        const h = (d.value / max) * (height - 30)
        const y = height - 20 - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw * 0.8} height={h} fill="#2563eb" opacity={0.85} />
            <text x={x + bw * 0.4} y={height - 8} fontSize="3" textAnchor="middle" fill="#6b7280">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data, height = 140 }: { data: { x: number; y: number }[]; height?: number }) {
  if (!data.length) return <div className="text-sm text-gray-500">No data</div>
  const xs = data.map((d) => d.x)
  const ys = data.map((d) => d.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = 0
  const maxY = Math.max(1, ...ys)
  const norm = (x: number, y: number) => ({
    nx: ((x - minX) / Math.max(1, maxX - minX)) * 100,
    ny: (1 - (y - minY) / Math.max(1, maxY - minY)) * (height - 30) + 10,
  })
  const points = data
    .sort((a, b) => a.x - b.x)
    .map((p) => {
      const { nx, ny } = norm(p.x, p.y)
      return `${nx},${ny}`
    })
    .join(" ")
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} className="bg-white border rounded">
      <polyline points={points} fill="none" stroke="#16a34a" strokeWidth={1.5} />
    </svg>
  )
}

function dowLabel(dow: number) {
  const map: Record<number, string> = { 1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" }
  return map[dow] || String(dow)
}

export default function StatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600">Loading statistics page...</span>
          </div>
        </div>
      </div>
    }>
      <StatsPageContent />
    </Suspense>
  )
}
