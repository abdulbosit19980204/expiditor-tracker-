"use client"

import React, { memo, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { 
  Bar, 
  BarChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts"
import { useTranslation } from "../../lib/simple-i18n"

// Memoized tooltip components
const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
})

const ExpeditorTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100">{data?.fullName || label}</p>
        <p className="text-sm text-blue-600">Checks: {data?.checks || 0}</p>
        <p className="text-sm text-green-600">Total: {data?.sum ? data.sum.toLocaleString() : 0}</p>
      </div>
    )
  }
  return null
})

const PaymentTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-sm" style={{ color: payload[0]?.color }}>
          {payload[0]?.name}: {typeof payload[0]?.value === 'number' ? payload[0].value.toLocaleString() : payload[0]?.value}
        </p>
        {data?.percentage && (
          <p className="text-sm text-gray-500">({data.percentage.toFixed(1)}%)</p>
        )}
      </div>
    )
  }
  return null
})

interface PerformanceOptimizedChartProps {
  title: string
  data: any[]
  dataKey: string
  type: 'bar' | 'line' | 'area' | 'pie'
  colors: string[]
  visible: boolean
  onToggleVisibility: () => void
  chartMode?: 'count' | 'sum'
  onModeChange?: (mode: 'count' | 'sum') => void
  showModeToggle?: boolean
  showGroupingToggle?: boolean
  groupingMode?: 'day' | 'week' | 'month'
  onGroupingChange?: (mode: 'day' | 'week' | 'month') => void
  customTooltip?: 'default' | 'expeditor' | 'payment'
  className?: string
}

const PerformanceOptimizedChart = memo<PerformanceOptimizedChartProps>(({
  title,
  data,
  dataKey,
  type,
  colors,
  visible,
  onToggleVisibility,
  chartMode = 'count',
  onModeChange,
  showModeToggle = false,
  showGroupingToggle = false,
  groupingMode = 'day',
  onGroupingChange,
  customTooltip = 'default',
  className = ""
}) => {
  const { t } = useTranslation()

  // Memoized chart configuration
  const chartConfig = useMemo(() => ({
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    barCategoryGap: "20%",
    maxBarSize: 60
  }), [])

  // Memoized tooltip component
  const TooltipComponent = useMemo(() => {
    switch (customTooltip) {
      case 'expeditor':
        return ExpeditorTooltip
      case 'payment':
        return PaymentTooltip
      default:
        return CustomTooltip
    }
  }, [customTooltip])

  // Memoized chart render function
  const renderChart = useCallback(() => {
    if (!visible || !data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>{t('noDataAvailable')}</p>
        </div>
      )
    }

    const commonProps = {
      data,
      margin: chartConfig.margin
    }

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<TooltipComponent />} />
            <Bar 
              dataKey={dataKey} 
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
              maxBarSize={chartConfig.maxBarSize}
            />
          </BarChart>
        )

      case 'line':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<TooltipComponent />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<TooltipComponent />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </AreaChart>
        )

      case 'pie':
        return (
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipComponent />} />
          </RechartsPieChart>
        )

      default:
        return null
    }
  }, [visible, data, dataKey, type, colors, chartConfig, TooltipComponent, t])

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {showModeToggle && onModeChange && (
            <Select value={chartMode} onValueChange={onModeChange}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">{t('count')}</SelectItem>
                <SelectItem value="sum">{t('sum')}</SelectItem>
              </SelectContent>
            </Select>
          )}
          {showGroupingToggle && onGroupingChange && (
            <Select value={groupingMode} onValueChange={onGroupingChange}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t('day')}</SelectItem>
                <SelectItem value="week">{t('week')}</SelectItem>
                <SelectItem value="month">{t('month')}</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className="h-8 w-8 p-0"
          >
            {visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {visible && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

PerformanceOptimizedChart.displayName = "PerformanceOptimizedChart"

export default PerformanceOptimizedChart
