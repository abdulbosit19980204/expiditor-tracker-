"use client"

import { TrendingUp, Receipt, DollarSign, Users, MapPin, Building } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Statistics } from "@/lib/types"

interface StatisticsPanelProps {
  statistics: Statistics | null
}

export function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (!statistics) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const successRate =
    statistics.totalChecks > 0 ? Math.round((statistics.successRate / statistics.totalChecks) * 100) : 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Statistics</h2>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-600">Total Checks</p>
                  <p className="text-lg font-bold">{statistics.totalChecks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-600">Total Sum</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(statistics.totalSum)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-600">Today</p>
                  <p className="text-lg font-bold">{statistics.todayChecks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-600">Success Rate</p>
                  <p className="text-lg font-bold">{successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(statistics.paymentMethods).map(([method, amount]) => {
              const percentage = statistics.totalSum > 0 ? Math.round((amount / statistics.totalSum) * 100) : 0

              const methodNames: Record<string, string> = {
                nalichniy: "Cash",
                uzcard: "UzCard",
                humo: "Humo",
                click: "Click",
              }

              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{methodNames[method]}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Top Expeditors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Expeditors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statistics.topExpeditors.slice(0, 3).map((expeditor, index) => (
              <div key={expeditor.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-xs font-medium truncate">{expeditor.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{expeditor.checkCount}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(expeditor.totalSum)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building className="h-4 w-4" />
              Top Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statistics.topProjects.slice(0, 3).map((project, index) => (
              <div key={project.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-xs font-medium truncate">{project.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{project.checkCount}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(project.totalSum)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Top Cities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statistics.topCities.slice(0, 3).map((city, index) => (
              <div key={city.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-xs font-medium truncate">{city.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{city.checkCount}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(city.totalSum)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
