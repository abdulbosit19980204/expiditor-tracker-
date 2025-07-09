"use client"

import { useEffect, useState } from "react"
import { TrendingUp, DollarSign, CheckCircle, CreditCard, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "./loading-spinner"
import type { FilterOptions, Statistics } from "../lib/types"
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
        const data = await getStatistics(filters)
        setStatistics(data)
      } catch (error) {
        console.error("Error loading statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [filters])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-gray-500">No statistics available</p>
      </div>
    )
  }

  const successRate = statistics.totalChecks > 0 ? (statistics.deliveredChecks / statistics.totalChecks) * 100 : 0

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Statistics</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
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
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Total Sum</p>
                <p className="text-sm font-bold">{formatCurrency(statistics.totalSum)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Success Rate</span>
            <span className="text-sm font-bold">{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{statistics.deliveredChecks} delivered</span>
            <span>{statistics.failedChecks} failed</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {statistics.paymentMethods.nalichniy > 0 && (
            <div className="flex justify-between text-sm">
              <span>Cash</span>
              <span className="font-medium">{formatCurrency(statistics.paymentMethods.nalichniy)}</span>
            </div>
          )}
          {statistics.paymentMethods.uzcard > 0 && (
            <div className="flex justify-between text-sm">
              <span>UzCard</span>
              <span className="font-medium">{formatCurrency(statistics.paymentMethods.uzcard)}</span>
            </div>
          )}
          {statistics.paymentMethods.humo > 0 && (
            <div className="flex justify-between text-sm">
              <span>Humo</span>
              <span className="font-medium">{formatCurrency(statistics.paymentMethods.humo)}</span>
            </div>
          )}
          {statistics.paymentMethods.click > 0 && (
            <div className="flex justify-between text-sm">
              <span>Click</span>
              <span className="font-medium">{formatCurrency(statistics.paymentMethods.click)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Expeditors */}
      {statistics.topExpeditors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Expeditors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {statistics.topExpeditors.slice(0, 3).map((expeditor, index) => (
              <div key={expeditor.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="truncate">{expeditor.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{expeditor.checksCount}</div>
                  <div className="text-xs text-gray-600">{formatCurrency(expeditor.totalSum)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Projects */}
      {statistics.topProjects.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {statistics.topProjects.slice(0, 3).map((project, index) => (
              <div key={project.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-100 text-green-800 rounded-full text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="truncate">{project.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{project.checksCount}</div>
                  <div className="text-xs text-gray-600">{formatCurrency(project.totalSum)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
