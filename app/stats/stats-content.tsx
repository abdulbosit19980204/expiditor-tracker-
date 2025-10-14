"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { CalendarIcon, TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { fetchGlobalStatistics, fetchProjects, fetchSklads, fetchCities } from "@/lib/api"
import type { GlobalStatistics } from "@/lib/types"

function StatsContentInner() {
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<GlobalStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  // Filter states
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [selectedSklad, setSelectedSklad] = useState<string>("")
  const [selectedCity, setSelectedCity] = useState<string>("")

  // Filter options
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([])
  const [sklads, setSklads] = useState<Array<{ id: number; name: string }>>([])
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoadingFilters(true)
        const [projectsData, skladsData, citiesData] = await Promise.all([
          fetchProjects(),
          fetchSklads(),
          fetchCities(),
        ])
        setProjects(projectsData)
        setSklads(skladsData)
        setCities(citiesData)
      } catch (error) {
        console.error("Error loading filter options:", error)
      } finally {
        setLoadingFilters(false)
      }
    }
    loadFilterOptions()
  }, [])

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const data = await fetchGlobalStatistics({
          start_date: format(dateRange.from, "yyyy-MM-dd"),
          end_date: format(dateRange.to, "yyyy-MM-dd"),
          project: selectedProject || undefined,
          sklad: selectedSklad || undefined,
          city: selectedCity || undefined,
        })
        setStats(data)
      } catch (error) {
        console.error("Error loading statistics:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [dateRange, selectedProject, selectedSklad, selectedCity])

  // Memoized chart data
  const dailyChartData = useMemo(() => {
    if (!stats?.daily_stats) return []
    return Object.entries(stats.daily_stats).map(([date, count]) => ({
      date: format(new Date(date), "MMM dd"),
      checks: count,
    }))
  }, [stats?.daily_stats])

  const hourlyChartData = useMemo(() => {
    if (!stats?.hourly_stats) return []
    return Object.entries(stats.hourly_stats).map(([hour, count]) => ({
      hour: `${hour}:00`,
      checks: count,
    }))
  }, [stats?.hourly_stats])

  const weekdayChartData = useMemo(() => {
    if (!stats?.dow_stats) return []
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return Object.entries(stats.dow_stats).map(([day, count]) => ({
      day: weekdays[Number.parseInt(day)] || day,
      checks: count,
    }))
  }, [stats?.dow_stats])

  const handleResetFilters = () => {
    setSelectedProject("")
    setSelectedSklad("")
    setSelectedCity("")
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    })
  }

  if (loading && !stats) {
    return <div className="flex items-center justify-center h-screen">Loading statistics...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Statistics</h1>
        <p className="text-muted-foreground">Overview of all expeditor activities</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Project Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject || "all"} onValueChange={(value) => setSelectedProject(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id?.toString() || `project-${project.id}`}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warehouse Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Warehouse</label>
              <Select value={selectedSklad || "all"} onValueChange={(value) => setSelectedSklad(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All warehouses</SelectItem>
                  {sklads.map((sklad) => (
                    <SelectItem key={sklad.id} value={sklad.id?.toString() || `sklad-${sklad.id}`}>
                      {sklad.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select value={selectedCity || "all"} onValueChange={(value) => setSelectedCity(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id?.toString() || `city-${city.id}`}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleResetFilters} variant="outline">
            Reset Filters
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_checks || 0}</div>
            <p className="text-xs text-muted-foreground">All expeditor checks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_sum?.toLocaleString() || 0} UZS</div>
            <p className="text-xs text-muted-foreground">Total check value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Check</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_check_sum?.toLocaleString() || 0} UZS</div>
            <p className="text-xs text-muted-foreground">Per check average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Expeditors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_expeditors || 0}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Distribution</CardTitle>
            <CardDescription>Number of checks per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="checks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Distribution</CardTitle>
            <CardDescription>Checks by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="checks" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekday Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Weekday Distribution</CardTitle>
            <CardDescription>Checks by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekdayChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="checks" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Warehouses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Warehouses</CardTitle>
            <CardDescription>Most active locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.top_sklads?.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.sklad__name || "Unknown"}</p>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${((item.count || 0) / (stats?.total_checks || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium">{item.count || 0}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function StatsContent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    }>
      <StatsContentInner />
    </Suspense>
  )
}
