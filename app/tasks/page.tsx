"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Loader2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ScheduledTask {
  id: number
  name: string
  task_type: string
  is_enabled: boolean
  interval_minutes: number
  next_run_at: string | null
  last_run_at: string | null
  params: any
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
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [taskRuns, setTaskRuns] = useState<TaskRun[]>([])
  const [loading, setLoading] = useState(true)
  const [runningTasks, setRunningTasks] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadTasks()
    loadTaskRuns()
    
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadTaskRuns()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks/')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.results || data)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const loadTaskRuns = async () => {
    try {
      const response = await fetch('/api/task-runs/')
      if (response.ok) {
        const data = await response.json()
        setTaskRuns(data.results || data)
      }
    } catch (error) {
      console.error('Failed to load task runs:', error)
    } finally {
      setLoading(false)
    }
  }

  const runTaskNow = async (taskId: number) => {
    try {
      setRunningTasks(prev => new Set(prev).add(taskId))
      
      const response = await fetch(`/api/tasks/${taskId}/run_now/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Task started successfully",
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
      const response = await fetch(`/api/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_enabled: enabled }),
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Task ${enabled ? 'enabled' : 'disabled'}`,
          variant: "success",
        })
        loadTasks()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
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
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (startedAt: string, finishedAt: string | null) => {
    const start = new Date(startedAt)
    const end = finishedAt ? new Date(finishedAt) : new Date()
    const duration = (end.getTime() - start.getTime()) / 1000
    return `${duration.toFixed(1)}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Task Management</h1>
        <Button onClick={() => { loadTasks(); loadTaskRuns(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Scheduled Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{task.name}</h3>
                      <Badge variant={task.is_enabled ? "default" : "secondary"}>
                        {task.is_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Badge variant="outline">
                        {getTaskTypeLabel(task.task_type)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Interval: {task.interval_minutes} minutes</p>
                      <p>Next run: {formatDateTime(task.next_run_at)}</p>
                      <p>Last run: {formatDateTime(task.last_run_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTask(task.id, !task.is_enabled)}
                    >
                      {task.is_enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {task.is_enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => runTaskNow(task.id)}
                      disabled={runningTasks.has(task.id)}
                    >
                      {runningTasks.has(task.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Run Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recent Task Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taskRuns.slice(0, 10).map((run) => (
              <div key={run.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run.is_running, run.finished_at)}
                    <span className="font-medium">{getTaskTypeLabel(run.task_type)}</span>
                    <Badge variant={run.is_running ? "default" : "secondary"}>
                      {run.is_running ? "Running" : "Completed"}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDuration(run.started_at, run.finished_at)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{run.status_message}</p>
                
                {run.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{run.processed}/{run.total}</span>
                    </div>
                    <Progress 
                      value={(run.processed / run.total) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  Started: {formatDateTime(run.started_at)}
                  {run.finished_at && (
                    <> • Finished: {formatDateTime(run.finished_at)}</>
                  )}
                </div>
              </div>
            ))}
            
            {taskRuns.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No task runs found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
