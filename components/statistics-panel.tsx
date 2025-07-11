"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, MapPin, CreditCard, Calendar, DollarSign } from "lucide-react"
import type { Statistics } from "@/lib/types"

interface StatisticsPanelProps {
  statistics: Statistics | null
}

export function StatisticsPanel({ statistics }: StatisticsPanelProps) {
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

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("uz-UZ", {
        style: "decimal",
        minimumFractionDigits: 0,
      }).format(amount) + " UZS"
    )
  }

  const totalPayments = statistics.paymentMethods
    ? Object.values(statistics.paymentMethods).reduce((sum, amount) => sum + amount, 0)
    : 0

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Statistics</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-600">Total Checks</p>
                <p className="text-lg font-bold">{statistics.totalChecks || 0}</p>
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
                <p className="text-sm font-bold">{formatCurrency(statistics.totalSum || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-600">Today</p>
                <p className="text-lg font-bold">{statistics.todayChecks || 0}</p>
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
                <p className="text-lg font-bold">{statistics.successRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      {statistics.paymentMethods && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statistics.paymentMethods).map(([method, amount]) => {
              const percentage = totalPayments > 0 ? (amount / totalPayments) * 100 : 0
              const methodLabels: Record<string, string> = {
                nalichniy: "Cash",
                uzcard: "UzCard",
                humo: "Humo",
                click: "Click",
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
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Top Expeditors */}
      {statistics.topExpeditors && statistics.topExpeditors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Expeditors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statistics.topExpeditors.slice(0, 3).map((expeditor, index) => (
              <div key={expeditor.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium truncate">{expeditor.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{expeditor.checkCount}</p>
                  <p className="text-gray-500">{formatCurrency(expeditor.totalSum)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Cities */}
      {statistics.topCities && statistics.topCities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Top Cities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statistics.topCities.slice(0, 3).map((city, index) => (
              <div key={city.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{city.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{city.checkCount}</p>
                  <p className="text-gray-500">{formatCurrency(city.totalSum)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
