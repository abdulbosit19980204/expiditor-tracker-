'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range"
import { CalendarIcon, RefreshCw, Users, Activity, MapPin, Clock, TrendingUp, Eye, Globe, BarChart3 } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// Dynamic imports to prevent hydration issues
const DynamicLineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), { ssr: false })
const DynamicBarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false })
const DynamicPieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), { ssr: false })

interface UserAnalyticsData {
  overview: {
    total_sessions: number
    active_sessions: number
    online_users: number
    date_range: {
      from: string
      to: string
    }
  }
  user_type_distribution: Array<{
    user_type: string
    count: number
  }>
  daily_active_users: Array<{
    date: string
    count: number
  }>
  hourly_activity: Array<{
    hour: string
    count: number
  }>
  activity_distribution: Array<{
    activity_type: string
    count: number
  }>
  geographic_distribution: Array<{
    location: string
    count: number
  }>
  session_statistics: {
    average_duration_minutes: number
    total_api_calls: number
    total_map_interactions: number
    total_page_views: number
  }
  recent_activities: Array<{
    id: number
    session_id: string
    ip_address: string
    user_type: string
    activity_type: string
    timestamp: string
    page_url?: string
    api_endpoint?: string
  }>
}

interface LiveUserData {
  online_users: Array<{
    session_id: string
    ip_address: string
    user_type: string
    last_activity: string
    session_duration_minutes: number
    location: string
  }>
  online_count: number
  today_stats: {
    total_today: number
    api_calls_today: number
    page_views_today: number
    map_interactions_today: number
  }
  recent_activities: Array<{
    session_id: string
    ip_address: string
    activity_type: string
    timestamp: string
    page_url?: string
  }>
  last_updated: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function UserAnalyticsPage() {
  const { user, token } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData | null>(null)
  const [liveData, setLiveData] = useState<LiveUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveLoading, setLiveLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  })
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  
  // Use refs to track latest values without causing re-renders
  const fetchAnalyticsDataRef = useRef<(() => Promise<void>) | undefined>(undefined)
  const fetchLiveDataRef = useRef<(() => Promise<void>) | undefined>(undefined)

  // Fix hydration error - initialize date range on client side only
  useEffect(() => {
    setMounted(true)
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date()
    })
  }, [])

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    if (!dateRange.from || !dateRange.to || !token) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        date_from: dateRange.from.toISOString(),
        date_to: dateRange.to.toISOString(),
        user_type: userTypeFilter
      })

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"
      const response = await fetch(`${API_BASE_URL}/admin/user-analytics/?${params}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange, userTypeFilter, token])

  // Store refs for callbacks
  useEffect(() => {
    fetchAnalyticsDataRef.current = fetchAnalyticsData
  }, [fetchAnalyticsData])

  // Fetch live data
  const fetchLiveData = useCallback(async () => {
    if (!token) return
    
    try {
      setLiveLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"
      const response = await fetch(`${API_BASE_URL}/admin/user-analytics/live/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch live data')
      }
      
      const data = await response.json()
      setLiveData(data)
    } catch (error) {
      console.error('Error fetching live data:', error)
    } finally {
      setLiveLoading(false)
    }
  }, [token])

  // Store refs for callbacks
  useEffect(() => {
    fetchLiveDataRef.current = fetchLiveData
  }, [fetchLiveData])

  // Fix hydration error - don't render until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is super user (only after mount to prevent hydration issues)
  if (!user?.is_superuser) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need super user privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Initial data fetch
  useEffect(() => {
    if (user?.is_superuser && token && mounted && dateRange.from && dateRange.to) {
      fetchAnalyticsDataRef.current?.()
      fetchLiveDataRef.current?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, userTypeFilter, user?.is_superuser, token, mounted])

  // Auto-refresh live data every 30 seconds
  useEffect(() => {
    if (!mounted || !user?.is_superuser || !token) return
    
    const interval = setInterval(() => {
      fetchLiveDataRef.current?.()
    }, 30000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user?.is_superuser, token])

  // Chart data processing
  const dailyChartData = useMemo(() => {
    if (!analyticsData?.daily_active_users) return []
    return analyticsData.daily_active_users.map((item, index) => ({
      id: `daily-${index}-${item.date}`,
      date: format(new Date(item.date), 'MMM dd'),
      users: item.count
    }))
  }, [analyticsData?.daily_active_users])

  const hourlyChartData = useMemo(() => {
    if (!analyticsData?.hourly_activity) return []
    return analyticsData.hourly_activity.map((item, index) => ({
      id: `hourly-${index}-${item.hour}`,
      hour: format(new Date(item.hour), 'HH:mm'),
      activity: item.count
    }))
  }, [analyticsData?.hourly_activity])

  const activityPieData = useMemo(() => {
    if (!analyticsData?.activity_distribution) return []
    return analyticsData.activity_distribution.map((item, index) => ({
      id: `activity-${index}-${item.activity_type}`,
      name: item.activity_type.replace('_', ' ').toUpperCase(),
      value: item.count,
      color: COLORS[index % COLORS.length]
    }))
  }, [analyticsData?.activity_distribution])

  const userTypePieData = useMemo(() => {
    if (!analyticsData?.user_type_distribution) return []
    return analyticsData.user_type_distribution.map((item, index) => ({
      id: `user-type-${index}-${item.user_type}`,
      name: item.user_type.replace('_', ' ').toUpperCase(),
      value: item.count,
      color: COLORS[index % COLORS.length]
    }))
  }, [analyticsData?.user_type_distribution])

  const geoChartData = useMemo(() => {
    if (!analyticsData?.geographic_distribution) return []
    return analyticsData.geographic_distribution.map((item, index) => ({
      id: `geo-${index}-${item.location}`,
      location: item.location,
      users: item.count
    }))
  }, [analyticsData?.geographic_distribution])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading user analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor user activity and system usage in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="date-range">Date Range:</Label>
              <DatePickerWithRange
                dateRange={dateRange}
                onDateRangeChange={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange(range)
                  }
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="user-type">User Type:</Label>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="super_user">Super Users</SelectItem>
                  <SelectItem value="regular_user">Regular Users</SelectItem>
                  <SelectItem value="guest">Guests</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateRange({
                  from: subDays(new Date(), 30), // Oxirgi 30 kun
                  to: new Date()
                })
                setUserTypeFilter('all')
              }}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Stats Cards */}
      {liveData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveData.online_count}</div>
              <p className="text-xs text-muted-foreground">
                Active in last 5 minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveData.today_stats.total_today}</div>
              <p className="text-xs text-muted-foreground">
                New sessions today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveData.today_stats.api_calls_today}</div>
              <p className="text-xs text-muted-foreground">
                Total API requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Map Interactions</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveData.today_stats.map_interactions_today}</div>
              <p className="text-xs text-muted-foreground">
                Yandex Maps usage
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics */}
      {analyticsData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.overview.total_sessions}</div>
                  <p className="text-xs text-muted-foreground">
                    In selected period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.overview.active_sessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 5 minutes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Online Users</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analyticsData.overview.online_users}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 2 minutes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.session_statistics.average_duration_minutes}m</div>
                  <p className="text-xs text-muted-foreground">
                    Average time spent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.session_statistics.total_page_views}</div>
                  <p className="text-xs text-muted-foreground">
                    All page visits
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Active Users</CardTitle>
                  <CardDescription>User sessions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <DynamicLineChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                    </DynamicLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Type Distribution</CardTitle>
                  <CardDescription>Breakdown by user type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <DynamicPieChart>
                      <Pie
                        data={userTypePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userTypePieData.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </DynamicPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Activity</CardTitle>
                  <CardDescription>Activity distribution by hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <DynamicBarChart data={hourlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="activity" fill="#8884d8" />
                    </DynamicBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Type Distribution</CardTitle>
                  <CardDescription>Types of user activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <DynamicPieChart>
                      <Pie
                        data={activityPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {activityPieData.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </DynamicPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geography" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Users by location</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <DynamicBarChart data={geoChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="location" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#8884d8" />
                  </DynamicBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest user activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recent_activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">{activity.user_type}</Badge>
                        <div>
                          <p className="font-medium">{activity.activity_type.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.ip_address} • {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{activity.session_id}</p>
                        {activity.page_url && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {activity.page_url}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
