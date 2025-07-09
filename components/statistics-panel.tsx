"use client"

import { useState, useEffect } from "react"
import { DollarSign, CheckCircle, XCircle, CreditCard, BarChart3, Users, Building, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "./loading-spinner"
import type { Statistics, FilterOptions } from "../lib/types"
import { getStatistics } from "../lib/api"

interface StatisticsPanelProps {
  filters: FilterOptions
}

export function StatisticsPanel({ filters }: StatisticsPanelProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true)
      try {
        const stats = await getStatistics(filters)
        setStatistics(stats)
      } catch (error) {
        console.error("Error loading statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [filters])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!statistics) {
    return <div className="h-full flex items-center justify-center text-gray-500">No statistics available</div>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const successRate = statistics.totalChecks > 0 ? (statistics.deliveredChecks / statistics.totalChecks) * 100 : 0

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Statistics</h2>
        <Badge variant="outline">{statistics.totalChecks} checks</Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalChecks}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics.deliveredChecks} delivered, {statistics.failedChecks} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sum</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalSum)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(statistics.totalSum / Math.max(statistics.totalChecks, 1))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
                <Progress value={successRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.failedChecks}</div>
                <p className="text-xs text-muted-foreground">
                  {((statistics.failedChecks / Math.max(statistics.totalChecks, 1)) * 100).toFixed(1)}% failure rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.dailyStats.map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{day.date}</div>
                      <div className="text-sm text-muted-foreground">{day.checksCount} checks</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(day.totalSum)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(day.totalSum / Math.max(day.checksCount, 1))} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nalichniy (Cash)</span>
                  <span className="font-bold">{formatCurrency(statistics.paymentMethods.nalichniy)}</span>
                </div>
                <Progress value={(statistics.paymentMethods.nalichniy / statistics.totalSum) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">UzCard</span>
                  <span className="font-bold">{formatCurrency(statistics.paymentMethods.uzcard)}</span>
                </div>
                <Progress value={(statistics.paymentMethods.uzcard / statistics.totalSum) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Humo</span>
                  <span className="font-bold">{formatCurrency(statistics.paymentMethods.humo)}</span>
                </div>
                <Progress value={(statistics.paymentMethods.humo / statistics.totalSum) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Click</span>
                  <span className="font-bold">{formatCurrency(statistics.paymentMethods.click)}</span>
                </div>
                <Progress value={(statistics.paymentMethods.click / statistics.totalSum) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          {/* Top Expeditors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Expeditors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.topExpeditors.map((expeditor, index) => (
                  <div key={expeditor.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{expeditor.name}</div>
                        <div className="text-sm text-muted-foreground">{expeditor.checksCount} checks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(expeditor.totalSum)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Top Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.topProjects.map((project, index) => (
                  <div key={project.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">{project.checksCount} checks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(project.totalSum)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top Cities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.topCities.map((city, index) => (
                  <div key={city.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{city.name}</div>
                        <div className="text-sm text-muted-foreground">{city.checksCount} checks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(city.totalSum)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
