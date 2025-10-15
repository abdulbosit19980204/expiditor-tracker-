"use client"

import React, { useEffect, useRef, useState, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Zap, Clock, TrendingUp } from "lucide-react"

interface PerformanceMetrics {
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  memoryUsage?: number
  isVisible: boolean
}

interface PerformanceMonitorProps {
  componentName: string
  enabled?: boolean
}

const PerformanceMonitor = memo<PerformanceMonitorProps>(({ 
  componentName, 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const renderCountRef = useRef(0)
  const renderTimesRef = useRef<number[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    isVisible: false
  })

  // Track render performance
  useEffect(() => {
    if (!enabled) return

    const startTime = performance.now()
    renderCountRef.current += 1

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      renderTimesRef.current.push(renderTime)
      
      // Keep only last 10 render times for average calculation
      if (renderTimesRef.current.length > 10) {
        renderTimesRef.current.shift()
      }

      const averageRenderTime = renderTimesRef.current.reduce((sum, time) => sum + time, 0) / renderTimesRef.current.length

      setMetrics(prev => ({
        ...prev,
        renderCount: renderCountRef.current,
        lastRenderTime: renderTime,
        averageRenderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      }))
    }
  })

  // Toggle visibility
  const toggleVisibility = () => {
    setMetrics(prev => ({ ...prev, isVisible: !prev.isVisible }))
  }

  if (!enabled || !metrics.isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleVisibility}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Show Performance Monitor"
        >
          <Activity className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-xl border-2 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Performance Monitor
            </CardTitle>
            <button
              onClick={toggleVisibility}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <Badge variant="outline" className="w-fit text-xs">
            {componentName}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Renders</p>
                <p className="text-sm font-medium">{metrics.renderCount}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Last Render</p>
                <p className="text-sm font-medium">{metrics.lastRenderTime.toFixed(2)}ms</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Avg Render Time</p>
              <p className="text-sm font-medium">{metrics.averageRenderTime.toFixed(2)}ms</p>
            </div>
          </div>

          {metrics.memoryUsage && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
              <div>
                <p className="text-xs text-gray-500">Memory Usage</p>
                <p className="text-sm font-medium">
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
          )}

          {/* Performance warnings */}
          {metrics.renderCount > 10 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800">
                ⚠️ High render count detected
              </p>
            </div>
          )}

          {metrics.averageRenderTime > 16 && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-800">
                ⚠️ Slow render times detected
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

PerformanceMonitor.displayName = "PerformanceMonitor"

export default PerformanceMonitor
