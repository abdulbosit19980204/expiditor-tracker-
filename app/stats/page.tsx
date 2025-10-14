"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Statistics } from "@/lib/types"
import { api } from "@/lib/api"

function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: firstDay, to: lastDay }
}

export default function StatsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(getCurrentMonthRange())
  const [project, setProject] = useState("")
  const [sklad, setSklad] = useState("")
  const [city, setCity] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Statistics | null>(null)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const filters = { dateRange, project, sklad, city, status }
      const data = await api.getGlobalStatistics(filters)
      setStats(data)
    } catch (e) {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [dateRange, project, sklad, city, status])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const formatNumber = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n || 0))

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">Global Statistics</h1>
          <Button variant="outline" onClick={loadStats}>Refresh</Button>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                <DatePickerWithRange dateRange={dateRange} onDateRangeChange={(r) => setDateRange(r || getCurrentMonthRange())} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Project</label>
                <input className="w-full border rounded-md px-3 py-2" placeholder="All" value={project} onChange={(e) => setProject(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Warehouse</label>
                <input className="w-full border rounded-md px-3 py-2" placeholder="All" value={sklad} onChange={(e) => setSklad(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
                <input className="w-full border rounded-md px-3 py-2" placeholder="All" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <select className="w-full border rounded-md px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
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
                <List items={(stats.topProjects || []).map(p => ({ label: p.name, value: p.checkCount }))} format={formatNumber} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Top Cities</h3>
                <List items={(stats.topCities || []).map(c => ({ label: c.name, value: c.checkCount }))} format={formatNumber} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Top Warehouses</h3>
                <List items={(stats.topSklads || []).map(s => ({ label: s.name, value: s.checkCount }))} format={formatNumber} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Daily Checks</h3>
                <div className="grid grid-cols-2 md:grid-cols-8 lg:grid-cols-12 gap-2">
                  {(stats.dailyStats || []).map((d) => (
                    <Bar key={d.date} label={new Date(d.date).toLocaleDateString()} value={d.checks} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Hourly Distribution</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(stats.hourlyStats || []).map((h) => (
                    <Bar key={h.hour} label={new Date(h.hour).getHours().toString()} value={h.checks} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold mb-3">Weekday Distribution</h3>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                  {(stats.dowStats || []).map((d) => (
                    <Bar key={d.dow} label={dowLabel(d.dow)} value={d.checks} />
                  ))}
                </div>
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
            <span className="truncate mr-2">{i.label || '-'}</span>
            <Badge variant="outline">{format(i.value)}</Badge>
          </div>
        ))
      )}
    </div>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, Math.round((value || 0) * 5))
  return (
    <div className="bg-white border rounded p-2">
      <div className="text-xs text-gray-500 truncate mb-1">{label}</div>
      <div className="h-2 bg-gray-100 rounded">
        <div className="h-2 bg-blue-500 rounded" style={{ width: `${width}%` }} />
      </div>
      <div className="text-[10px] text-gray-500 mt-1">{value}</div>
    </div>
  )
}

function dowLabel(dow: number) {
  const map: Record<number, string> = { 1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat' }
  return map[dow] || String(dow)
}
