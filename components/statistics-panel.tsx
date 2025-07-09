"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, DollarSign, Users, MapPin, Calendar, CreditCard, Building } from "lucide-react"
import type { Check, Expeditor } from "@/lib/types"

interface StatisticsPanelProps {
  checks: Check[]
  expeditors: Expeditor[]
  isLoading?: boolean
}

export function StatisticsPanel({ checks, expeditors, isLoading }: StatisticsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate statistics
  const totalChecks = checks.length
  const totalSum = checks.reduce((sum, check) => sum + (check.total_sum || 0), 0)
  const todayChecks = checks.filter((check) => {
    const today = new Date()
    const checkDate = new Date(check.check_date)
    return checkDate.toDateString() === today.toDateString()
  }).length

  // Payment method statistics
  const paymentStats = {
    nalichniy: checks.reduce((sum, check) => sum + (check.nalichniy || 0), 0),
    uzcard: checks.reduce((sum, check) => sum + (check.uzcard || 0), 0),
    humo: checks.reduce((sum, check) => sum + (check.humo || 0), 0),
    click: checks.reduce((sum, check) => sum + (check.click || 0), 0),
  }

  // Top expeditors by check count
  const expeditorStats = expeditors
    .map((exp) => {
      const expChecks = checks.filter((check) => check.ekispiditor === exp.name)
      const todayExpChecks = expChecks.filter((check) => {
        const today = new Date()
        const checkDate = new Date(check.check_date)
        return checkDate.toDateString() === today.toDateString()
      })
      return {
        ...exp,
        totalChecks: expChecks.length,
        todayChecks: todayExpChecks.length,
        totalSum: expChecks.reduce((sum, check) => sum + (check.total_sum || 0), 0),
      }
    })
    .sort((a, b) => b.totalChecks - a.totalChecks)

  // Project statistics
  const projectStats = checks.reduce(
    (acc, check) => {
      const project = check.project || "Noma'lum"
      if (!acc[project]) {
        acc[project] = { count: 0, sum: 0 }
      }
      acc[project].count++
      acc[project].sum += check.total_sum || 0
      return acc
    },
    {} as Record<string, { count: number; sum: number }>,
  )

  // City statistics
  const cityStats = checks.reduce(
    (acc, check) => {
      const city = check.city || "Noma'lum"
      if (!acc[city]) {
        acc[city] = { count: 0, sum: 0 }
      }
      acc[city].count++
      acc[city].sum += check.total_sum || 0
      return acc
    },
    {} as Record<string, { count: number; sum: number }>,
  )

  const averageCheckAmount = totalChecks > 0 ? totalSum / totalChecks : 0
  const successRate =
    totalChecks > 0 ? (checks.filter((c) => c.total_sum && c.total_sum > 0).length / totalChecks) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Checklar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChecks.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-2">
                Bugun: {todayChecks}
              </Badge>
              {todayChecks > 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Summa</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSum.toLocaleString()} so'm</div>
            <p className="text-xs text-muted-foreground">O'rtacha: {averageCheckAmount.toLocaleString()} so'm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Muvaffaqiyat</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            To'lov Usullari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(paymentStats).map(([method, amount]) => {
            const percentage = totalSum > 0 ? (amount / totalSum) * 100 : 0
            const methodNames = {
              nalichniy: "Naqd",
              uzcard: "UzCard",
              humo: "Humo",
              click: "Click",
            }
            const colors = {
              nalichniy: "bg-green-500",
              uzcard: "bg-blue-500",
              humo: "bg-purple-500",
              click: "bg-yellow-500",
            }

            return (
              <div key={method} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[method as keyof typeof colors]}`}></div>
                    <span>{methodNames[method as keyof typeof methodNames]}</span>
                  </div>
                  <span className="font-medium">{amount.toLocaleString()} so'm</span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">{percentage.toFixed(1)}%</div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Top Expeditors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Top Expeditorlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {expeditorStats.slice(0, 5).map((exp, index) => (
            <div key={exp.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">{exp.name}</div>
                  <div className="text-xs text-muted-foreground">{exp.phone_number}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{exp.totalChecks} check</div>
                <div className="text-xs text-muted-foreground">Bugun: {exp.todayChecks}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            Top Loyihalar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(projectStats)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([project, stats]) => (
              <div key={project} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{project}</div>
                  <div className="text-xs text-muted-foreground">{stats.sum.toLocaleString()} so'm</div>
                </div>
                <Badge variant="secondary">{stats.count}</Badge>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Top Cities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Top Shaharlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(cityStats)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([city, stats]) => (
              <div key={city} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{city}</div>
                  <div className="text-xs text-muted-foreground">{stats.sum.toLocaleString()} so'm</div>
                </div>
                <Badge variant="secondary">{stats.count}</Badge>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Daily Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Kunlik Ko'rsatkichlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bugungi checklar:</span>
              <span className="font-medium">{todayChecks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bugungi summa:</span>
              <span className="font-medium">
                {checks
                  .filter((check) => {
                    const today = new Date()
                    const checkDate = new Date(check.check_date)
                    return checkDate.toDateString() === today.toDateString()
                  })
                  .reduce((sum, check) => sum + (check.total_sum || 0), 0)
                  .toLocaleString()}{" "}
                so'm
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Faol expeditorlar:</span>
              <span className="font-medium">{expeditorStats.filter((exp) => exp.todayChecks > 0).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
