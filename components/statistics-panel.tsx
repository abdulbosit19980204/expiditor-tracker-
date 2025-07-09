"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  CreditCard,
  Users,
  Building,
  MapPin,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("uz-UZ").format(num)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Failed to load statistics</p>
      </div>
    )
  }

  const successRate = statistics.totalChecks > 0 ? (statistics.deliveredChecks / statistics.totalChecks) * 100 : 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Statistics
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Checks</p>
                  <p className="text-lg font-bold">{formatNumber(statistics.totalChecks)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Sum</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(statistics.totalSum)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Rate */}
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm font-bold">{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {statistics.deliveredChecks} delivered
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  {statistics.failedChecks} failed
                </span>
              </div>
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
          <CardContent className="space-y-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">Cash</span>
                <span className="text-xs font-medium">{formatCurrency(statistics.paymentMethods.nalichniy)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">UzCard</span>
                <span className="text-xs font-medium">{formatCurrency(statistics.paymentMethods.uzcard)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Humo</span>
                <span className="text-xs font-medium">{formatCurrency(statistics.paymentMethods.humo)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Click</span>
                <span className="text-xs font-medium">{formatCurrency(statistics.paymentMethods.click)}</span>
              </div>
            </div>
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
            {statistics.topExpeditors.map((expeditor, index) => (
              <div key={expeditor.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-5 h-5 p-0 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-xs font-medium">{expeditor.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{expeditor.checksCount} checks</div>
                  <div className="text-xs text-gray-500">{formatCurrency(expeditor.totalSum)}</div>
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
            {statistics.topProjects.map((project, index) => (
              <div key={project.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-5 h-5 p-0 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-xs font-medium">{project.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{project.checksCount} checks</div>
                  <div className="text-xs text-gray-500">{formatCurrency(project.totalSum)}</div>
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
            {statistics.topCities.map((city, index) => (
              <div key={city.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-5 h-5 p-0 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-xs font-medium">{city.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{city.checksCount} checks</div>
                  <div className="text-xs text-gray-500">{formatCurrency(city.totalSum)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Daily Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statistics.dailyStats.map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  {new Date(day.date).toLocaleDateString("uz-UZ", {
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </span>
                <div className="text-right">
                  <div className="text-xs font-bold">{day.checksCount} checks</div>
                  <div className="text-xs text-gray-500">{formatCurrency(day.totalSum)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
