"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronUp,
  Settings,
  Activity,
  Timer,
  Calendar,
  Home,
  ArrowLeft,
  Key,
  LogOut,
  User,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  Target,
  BarChart3
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"

interface ScheduledTask {
  id: number
  name: string
  task_type: string
  is_enabled: boolean
  interval_minutes: number
  next_run_at: string | null
  last_run_at: string | null
  params: any
  created_at: string
  updated_at: string
  estimated_duration: number
}

interface TaskRun {
  id: number
  task_type: string
  is_running: boolean
  processed: number
  total: number
  status_message: string
  started_at: string
  finished_at: string | null
  duration: number
  status_display: string
}

interface TaskInfo {
  id: number
  code: string
  name: string
  description: string
  default_params: any
  sample_result: string | null
  is_active: boolean
}

interface TaskAnalytics {
  overview: {
    total_runs: number
    completed_runs: number
    failed_runs: number
    running_now: number
    success_rate: number
    avg_duration_seconds: number
  }
  most_frequent_tasks: Array<{ task_type: string; run_count: number }>
  fastest_tasks: Array<{ task_type: string; avg_duration_seconds: number; run_count: number }>
  slowest_tasks: Array<{ task_type: string; avg_duration_seconds: number; run_count: number }>
  by_task_type: Array<{ task_type: string; total: number; completed: number; failed: number; running: number }>
}

interface PaginationInfo {
  count: number
  next: string | null
  previous: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"

export default function TaskManagement() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [taskRuns, setTaskRuns] = useState<TaskRun[]>([])
  const [taskInfoList, setTaskInfoList] = useState<TaskInfo[]>([])
  const [selectedTaskInfo, setSelectedTaskInfo] = useState<TaskInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningTasks, setRunningTasks] = useState<Set<number>>(new Set())
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({ count: 0, next: null, previous: null })
  
  // Analytics state
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null)

  useEffect(() => {
    loadTasks()
    loadTaskRuns()
    loadTaskInfo()
    loadAnalytics()
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadTaskRuns()
      loadAnalytics()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    loadTaskRuns()
  }, [currentPage, pageSize])

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const loadTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Token ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/tasks/`, {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setTasks(data.results || data)
      } else {
        console.error('Failed to load tasks:', response.statusText)
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      })
    }
  }, [])

  const loadTaskRuns = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Token ${token}`
      }

      const url = `${API_BASE_URL}/task-runs/?page=${currentPage}&page_size=${pageSize}`
      const response = await fetch(url, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setTaskRuns(data.results || data)
        setPaginationInfo({
          count: data.count || 0,
          next: data.next || null,
          previous: data.previous || null
        })
      } else {
        console.error('Failed to load task runs:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to load task runs:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize])

  const loadTaskInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Token ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/task-list/`, {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setTaskInfoList(data.results || data)
      } else {
        console.error('Failed to load task info:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to load task info:', error)
    }
  }, [])
  
  const loadAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Token ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/task-analytics/?days=7`, {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to load analytics:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }, [])

  const runTaskNow = async (taskId: number) => {
    try {
      setRunningTasks(prev => new Set(prev).add(taskId))
      
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Token ${token}`
      }
      
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/run_now/`, {
        method: 'POST',
        headers,
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message || "Task started successfully",
          variant: "success",
        })
        loadTaskRuns()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to start task",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start task",
        variant: "destructive",
      })
    } finally {
      setRunningTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const toggleTask = async (taskId: number, enabled: boolean) => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Token ${token}`
      }
      
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_enabled: enabled }),
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Task ${enabled ? 'enabled' : 'disabled'}`,
        })
        loadTasks()
      } else {
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }
  
  const cancelTaskRun = async (taskRunId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Token ${token}`
      }
      
      const response = await fetch(`${API_BASE_URL}/task-runs/${taskRunId}/cancel/`, {
        method: 'POST',
        headers,
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message || "Task cancelled successfully",
        })
        loadTaskRuns()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to cancel task",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel task",
        variant: "destructive",
      })
    }
  }

  const getTaskTypeLabel = (taskType: string) => {
    const labels = {
      'UPDATE_CHECKS': 'Update Checks',
      'SCAN_PROBLEMS': 'Scan Problems',
      'SEND_ANALYTICS': 'Send Analytics',
      'ANALYZE_PATTERNS': 'Analyze Patterns',
    }
    return labels[taskType as keyof typeof labels] || taskType
  }

  const getTaskTypeIcon = (taskType: string) => {
    const icons = {
      'UPDATE_CHECKS': <RefreshCw className="h-4 w-4" />,
      'SCAN_PROBLEMS': <AlertCircle className="h-4 w-4" />,
      'SEND_ANALYTICS': <Activity className="h-4 w-4" />,
      'ANALYZE_PATTERNS': <Settings className="h-4 w-4" />,
    }
    return icons[taskType as keyof typeof icons] || <Settings className="h-4 w-4" />
  }

  const getStatusIcon = (isRunning: boolean, finishedAt: string | null) => {
    if (isRunning) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    } else if (finishedAt) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDuration = (startedAt: string, finishedAt: string | null) => {
    const start = new Date(startedAt)
    const end = finishedAt ? new Date(finishedAt) : new Date()
    const duration = (end.getTime() - start.getTime()) / 1000
    return `${duration.toFixed(1)}s`
  }
  
  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`
    } else if (seconds < 60) {
      return `~${seconds.toFixed(1)}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `~${minutes}m ${secs}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `~${hours}h ${minutes}m`
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Running':
        return 'default'
      case 'Completed':
        return 'outline'
      case 'Failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Task Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage scheduled tasks and monitor their execution
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* User Profile */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {user?.first_name} {user?.last_name}
            </span>
          </div>
          
          <Button onClick={() => { loadTasks(); loadTaskRuns(); }} variant="outline" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/yandex-tokens">
            <Button variant="outline" title="Yandex Tokens">
              <Key className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" title="Home">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" onClick={logout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.is_enabled).length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running Tasks</p>
                <p className="text-2xl font-bold">{taskRuns.filter(r => r.is_running).length}</p>
              </div>
              <Loader2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold">{taskRuns.length}</p>
              </div>
              <Timer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Task Analytics (Last 7 Days)
          </h2>
          
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.overview.success_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.overview.completed_runs} / {analytics.overview.total_runs} tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <Timer className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.overview.avg_duration_seconds.toFixed(1)}s
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Average task execution time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Failed Tasks</p>
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {analytics.overview.failed_runs}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total failures in 7 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Most Frequent Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  Most Frequent Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.most_frequent_tasks.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs font-medium text-gray-700">{task.task_type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {task.run_count} runs
                    </Badge>
                  </div>
                ))}
                {analytics.most_frequent_tasks.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Fastest Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  Fastest Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.fastest_tasks.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs font-medium text-gray-700">{task.task_type}</span>
                    <Badge variant="outline" className="text-xs text-green-600">
                      {task.avg_duration_seconds.toFixed(1)}s
                    </Badge>
                  </div>
                ))}
                {analytics.fastest_tasks.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Task Type Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  By Task Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.by_task_type.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">{task.task_type}</span>
                      <span className="text-xs text-gray-500">{task.total} total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full" 
                          style={{ width: `${(task.completed / task.total * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-green-600 font-medium">
                        {task.completed}
                      </span>
                      <span className="text-xs text-red-600 font-medium">
                        {task.failed}
                      </span>
                    </div>
                  </div>
                ))}
                {analytics.by_task_type.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Scheduled Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Est. Time</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTaskTypeIcon(task.task_type)}
                        <span className="text-sm">{getTaskTypeLabel(task.task_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.is_enabled ? "default" : "secondary"}>
                        {task.is_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <span>{task.interval_minutes} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">
                          {formatEstimatedTime(task.estimated_duration || 1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{formatDateTime(task.next_run_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDateTime(task.last_run_at)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const taskInfo = taskInfoList.find(t => t.code === task.task_type)
                            if (taskInfo) setSelectedTaskInfo(taskInfo)
                          }}
                          title="Task Info"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTask(task.id, !task.is_enabled)}
                          title={task.is_enabled ? "Disable" : "Enable"}
                        >
                          {task.is_enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => runTaskNow(task.id)}
                          disabled={runningTasks.has(task.id) || !task.is_enabled}
                          title="Run Now"
                        >
                          {runningTasks.has(task.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {tasks.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No scheduled tasks found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Runs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Task Runs
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Per page:</span>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTaskTypeIcon(run.task_type)}
                        <span className="font-medium">{getTaskTypeLabel(run.task_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(run.status_display)}>
                        {getStatusIcon(run.is_running, run.finished_at)}
                        <span className="ml-1">{run.status_display}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {run.total > 0 ? (
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(run.processed / run.total) * 100} 
                            className="w-20 h-2"
                          />
                          <span className="text-xs text-gray-500">{run.processed}/{run.total}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDateTime(run.started_at)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{run.duration ? `${run.duration.toFixed(1)}s` : '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 max-w-xs truncate">
                        {run.status_message || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {run.is_running && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cancelTaskRun(run.id)}
                          title="Stop Task"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {taskRuns.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No task runs found
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {paginationInfo.count > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {taskRuns.length} of {paginationInfo.count} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!paginationInfo.previous}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-700 px-3">
                  Page {currentPage} of {Math.ceil(paginationInfo.count / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!paginationInfo.next}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Info Dialog */}
      <Dialog open={selectedTaskInfo !== null} onOpenChange={() => setSelectedTaskInfo(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              {selectedTaskInfo?.name}
            </DialogTitle>
            <DialogDescription>
              Task Code: {selectedTaskInfo?.code}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {selectedTaskInfo && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2 sticky top-0 bg-white py-1">Description</h3>
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedTaskInfo.description}
                  </div>
                </div>
                
                {selectedTaskInfo.default_params && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-2 sticky top-0 bg-white py-1">Default Parameters</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <pre className="text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre">
{JSON.stringify(selectedTaskInfo.default_params, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedTaskInfo.sample_result && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-2 sticky top-0 bg-white py-1">Sample Result</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <pre className="text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre">
{selectedTaskInfo.sample_result}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t bg-gray-50/50 flex items-center justify-between">
            <Badge variant={selectedTaskInfo?.is_active ? "default" : "secondary"}>
              {selectedTaskInfo?.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setSelectedTaskInfo(null)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          size="icon"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
    </div>
    </AuthGuard>
  )
}
