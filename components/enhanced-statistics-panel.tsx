"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  EyeOff
} from "lucide-react"
import type { Statistics } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"

// Katta raqamlarni formatlash funksiyasi
const formatLargeNumber = (num: number): { main: string; sub: string } => {
  if (num >= 1000000000) {
    const billions = (num / 1000000000).toFixed(1)
    const remainder = num % 1000000000
    return {
      main: `${billions}B`,
      sub: remainder.toLocaleString()
    }
  } else if (num >= 1000000) {
    const millions = (num / 1000000).toFixed(1)
    const remainder = num % 1000000
    return {
      main: `${millions}M`,
      sub: remainder.toLocaleString()
    }
  } else if (num >= 1000) {
    const thousands = (num / 1000).toFixed(1)
    const remainder = num % 1000
    return {
      main: `${thousands}K`,
      sub: remainder.toLocaleString()
    }
  }
  return { main: num.toLocaleString(), sub: '' }
}

interface EnhancedStatisticsPanelProps {
  statistics: Statistics | null
  isLoading?: boolean
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  isVisible?: boolean
  onToggleVisibility?: () => void
}

const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  description, 
  isVisible = true,
  onToggleVisibility 
}: MetricCardProps) {
  if (!isVisible) return null

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {typeof value === 'number' ? (
                <div>
                  <p className="text-2xl font-bold text-gray-900 leading-tight">
                    {formatLargeNumber(value).main}
                  </p>
                  {formatLargeNumber(value).sub && (
                    <p className="text-xs text-gray-400 font-normal">
                      {formatLargeNumber(value).sub}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {value}
                </p>
              )}
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {trend && (
              <div className={`flex items-center space-x-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{trend.value}%</span>
              </div>
            )}
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                className="h-8 w-8 p-0"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export function EnhancedStatisticsPanel({ statistics, isLoading }: EnhancedStatisticsPanelProps) {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(true)
  const [visibleMetrics, setVisibleMetrics] = useState({
    totalChecks: true,
    deliveredChecks: true,
    failedChecks: true,
    pendingChecks: true,
    totalSum: true,
    avgCheckSum: true,
    successRate: true,
    todayChecks: true,
  })

  const toggleMetricVisibility = useCallback((metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }))
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("uz-UZ", { 
      style: "decimal", 
      minimumFractionDigits: 0 
    }).format(amount) + " UZS"
  }, [])

  const metrics = useMemo(() => {
    if (!statistics) return []

    return [
      {
        key: 'totalChecks' as const,
        title: t('total_checks'),
        value: statistics.totalChecks,
        icon: <MapPin className="h-5 w-5 text-blue-600" />,
        description: t('all_expeditor_checks'),
        trend: { value: 12, isPositive: true }
      },
      {
        key: 'deliveredChecks' as const,
        title: t('delivered'),
        value: statistics.deliveredChecks,
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        description: t('successfully_delivered'),
        trend: { value: 8, isPositive: true }
      },
      {
        key: 'failedChecks' as const,
        title: t('failed'),
        value: statistics.failedChecks,
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        description: t('failed_deliveries'),
        trend: { value: -5, isPositive: false }
      },
      {
        key: 'pendingChecks' as const,
        title: t('pending'),
        value: statistics.pendingChecks,
        icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        description: t('awaiting_delivery'),
        trend: { value: 3, isPositive: true }
      },
      {
        key: 'totalSum' as const,
        title: t('total_amount'),
        value: statistics.totalSum, // Raqam sifatida yuborish
        icon: <DollarSign className="h-5 w-5 text-green-600" />,
        description: t('total_check_value'),
        trend: { value: 15, isPositive: true }
      },
      {
        key: 'avgCheckSum' as const,
        title: t('average_check'),
        value: statistics.avgCheckSum || 0, // Raqam sifatida yuborish
        icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
        description: t('per_check_average'),
        trend: { value: 7, isPositive: true }
      },
      {
        key: 'successRate' as const,
        title: t('success_rate'),
        value: `${statistics.successRate.toFixed(1)}%`,
        icon: <Users className="h-5 w-5 text-purple-600" />,
        description: t('delivery_success_rate'),
        trend: { value: 2, isPositive: true }
      },
      {
        key: 'todayChecks' as const,
        title: t('todays_checks'),
        value: statistics.todayChecks,
        icon: <Clock className="h-5 w-5 text-orange-600" />,
        description: t('checks_today'),
        trend: { value: 20, isPositive: true }
      }
    ]
  }, [statistics, formatCurrency])

  const handleExport = useCallback(() => {
    if (!statistics) return

    const csvData = [
      ['Metric', 'Value', 'Description'],
      ...metrics.map(metric => [
        metric.title,
        metric.value,
        metric.description || ''
      ])
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
  }, [statistics, metrics])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('statistics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('statistics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No statistics available</p>
            <p className="text-sm mt-2">Select an expeditor to view statistics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('statistics')}
                <Badge variant="outline" className="ml-2">
                  {metrics.filter(m => visibleMetrics[m.key]).length} {t('visible')}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExport()
                  }}
                  className="h-8"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.key}
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  trend={metric.trend}
                  description={metric.description}
                  isVisible={visibleMetrics[metric.key]}
                  onToggleVisibility={() => toggleMetricVisibility(metric.key)}
                />
              ))}
            </div>
            
            {/* Payment Methods Breakdown */}
            {statistics.paymentMethods && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Methods
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(statistics.paymentMethods).map(([method, amount]) => (
                    <div key={method} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600 capitalize">
                        {method === 'nalichniy' ? 'Cash' : 
                         method === 'uzcard' ? 'UzCard' :
                         method === 'humo' ? 'Humo' : 'Click'}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
