"use client"

import React, { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts"

// Memoized chart components
interface ChartProps {
  data: any[]
  title: string
  icon: React.ReactNode
  mode: 'count' | 'sum'
  onModeChange: (mode: 'count' | 'sum') => void
  groupingMode?: 'day' | 'week' | 'month'
  onGroupingChange?: (mode: 'day' | 'week' | 'month') => void
  showGrouping?: boolean
  tooltip?: React.ComponentType<any>
  color: string
  dataKey: string
  chartType: 'bar' | 'area' | 'pie'
}

const Chart = memo<ChartProps>(({
  data,
  title,
  icon,
  mode,
  onModeChange,
  groupingMode,
  onGroupingChange,
  showGrouping = false,
  tooltip,
  color,
  dataKey,
  chartType
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showGrouping && groupingMode && onGroupingChange && (
              <Select value={groupingMode} onValueChange={onGroupingChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">By Day</SelectItem>
                  <SelectItem value="week">By Week</SelectItem>
                  <SelectItem value="month">By Month</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={mode} onValueChange={onModeChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="sum">Sum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartType === 'pie' ? 300 : 400}>
          {chartType === 'bar' && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              {tooltip && <Tooltip content={tooltip} />}
              <Bar dataKey={dataKey} fill={color} />
            </BarChart>
          )}
          {chartType === 'area' && (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              {tooltip && <Tooltip content={tooltip} />}
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                fill={color}
                fillOpacity={0.3}
              />
            </AreaChart>
          )}
          {chartType === 'pie' && (
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {tooltip && <Tooltip content={tooltip} />}
            </RechartsPieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

Chart.displayName = "MemoizedChart"

export default Chart
