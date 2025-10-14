"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  CreditCard, 
  Calendar, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import type { Statistics } from "@/lib/types"

interface EnhancedStatisticsPanelProps {
  statistics: Statistics | null
}

export function EnhancedStatisticsPanel({ statistics }: EnhancedStatisticsPanelProps) {
  const { t } = useTranslation()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'performance']))
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " UZS"
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (!statistics) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const totalPayments = statistics.paymentMethods
    ? Object.values(statistics.paymentMethods).reduce((sum, amount) => sum + amount, 0)
    : 0

  const performanceMetrics = useMemo(() => {
    if (!statistics) return null

    const deliveredRate = statistics.totalChecks > 0 ? (statistics.deliveredChecks / statistics.totalChecks) * 100 : 0
    const failedRate = statistics.totalChecks > 0 ? (statistics.failedChecks / statistics.totalChecks) * 100 : 0
    const avgCheckValue = statistics.totalChecks > 0 ? statistics.totalSum / statistics.totalChecks : 0

    return {
      deliveredRate,
      failedRate,
      avgCheckValue,
      efficiency: Math.max(0, 100 - failedRate - (statistics.pendingChecks / statistics.totalChecks) * 100)
    }
  }, [statistics])

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = "blue",
    subtitle 
  }: {
    title: string
    value: string | number
    icon: any
    trend?: 'up' | 'down' | 'neutral'
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
    subtitle?: string
  }) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100", 
      orange: "text-orange-600 bg-orange-100",
      red: "text-red-600 bg-red-100",
      purple: "text-purple-600 bg-purple-100"
    }

    const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
    const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
              </div>
            </div>
            {trendIcon && (
              <trendIcon className={`h-4 w-4 ${trendColor}`} />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">{t('statistics')}</h2>
        </div>
        <Tabs value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">{t('daily')}</TabsTrigger>
            <TabsTrigger value="weekly">{t('weekly')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Metrics */}
      <Collapsible 
        open={expandedSections.has('overview')} 
        onOpenChange={() => toggleSection('overview')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('overview')}
            </h3>
            {expandedSections.has('overview') ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title={t('totalChecks')}
              value={statistics.totalChecks || 0}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title={t('totalSum')}
              value={formatCurrency(statistics.totalSum || 0)}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title={t('successRate')}
              value={`${statistics.successRate || 0}%`}
              icon={CheckCircle}
              color="green"
              trend="up"
            />
            <StatCard
              title={t('avgCheckValue')}
              value={formatCurrency(statistics.avgCheckSum || 0)}
              icon={TrendingUp}
              color="purple"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Performance Analysis */}
      <Collapsible 
        open={expandedSections.has('performance')} 
        onOpenChange={() => toggleSection('performance')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('performanceAnalysis')}
            </h3>
            {expandedSections.has('performance') ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <div className="grid grid-cols-1 gap-3">
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-3">{t('deliveryStatus')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{t('delivered')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{statistics.deliveredChecks}</span>
                      <Badge variant="outline" className="text-xs">
                        {performanceMetrics?.deliveredRate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={performanceMetrics?.deliveredRate || 0} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">{t('failed')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{statistics.failedChecks}</span>
                      <Badge variant="outline" className="text-xs">
                        {performanceMetrics?.failedRate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={performanceMetrics?.failedRate || 0} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{t('pending')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{statistics.pendingChecks}</span>
                      <Badge variant="outline" className="text-xs">
                        {((statistics.pendingChecks / statistics.totalChecks) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={(statistics.pendingChecks / statistics.totalChecks) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Payment Methods */}
      <Collapsible 
        open={expandedSections.has('payments')} 
        onOpenChange={() => toggleSection('payments')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('paymentMethods')}
            </h3>
            {expandedSections.has('payments') ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {statistics.paymentMethods && Object.entries(statistics.paymentMethods).map(([method, amount]) => {
                  const percentage = totalPayments > 0 ? (amount / totalPayments) * 100 : 0
                  const methodLabels: Record<string, string> = {
                    nalichniy: t('cash'),
                    uzcard: t('uzcard'),
                    humo: t('humo'),
                    click: t('click'),
                  }

                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{methodLabels[method] || method}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(amount)}
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-gray-500 text-right">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Top Performers */}
      <Collapsible 
        open={expandedSections.has('performers')} 
        onOpenChange={() => toggleSection('performers')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('topPerformers')}
            </h3>
            {expandedSections.has('performers') ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <Tabs defaultValue="expeditors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expeditors">{t('expeditors')}</TabsTrigger>
              <TabsTrigger value="projects">{t('projects')}</TabsTrigger>
              <TabsTrigger value="cities">{t('cities')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="expeditors" className="space-y-2">
              {statistics.topExpeditors && statistics.topExpeditors.slice(0, 3).map((expeditor, index) => (
                <div key={expeditor.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate">{expeditor.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{expeditor.checkCount}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(expeditor.totalSum)}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="projects" className="space-y-2">
              {statistics.topProjects && statistics.topProjects.slice(0, 3).map((project, index) => (
                <div key={project.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate">{project.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{project.checkCount}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(project.totalSum)}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="cities" className="space-y-2">
              {statistics.topCities && statistics.topCities.slice(0, 3).map((city, index) => (
                <div key={city.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate">{city.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{city.checkCount}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(city.totalSum)}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Collapsible>

      {/* Daily Statistics */}
      {statistics.dailyStats && statistics.dailyStats.length > 0 && (
        <Collapsible 
          open={expandedSections.has('daily')} 
          onOpenChange={() => toggleSection('daily')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <h3 className="text-md font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('dailyStats')}
              </h3>
              {expandedSections.has('daily') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1 text-xs text-center">
                  {/* Weekday headers */}
                  {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((day) => (
                    <div key={day} className="font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                  {/* Calendar days - simplified for mobile */}
                  {statistics.dailyStats.slice(0, 7).map((day, index) => (
                    <div
                      key={index}
                      className="p-2 h-12 flex flex-col items-center justify-center border rounded"
                    >
                      <span className="text-xs">{index + 1}</span>
                      <Badge
                        variant={day.checks > 0 ? "default" : "secondary"}
                        className="mt-1 text-xs"
                      >
                        {day.checks}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}