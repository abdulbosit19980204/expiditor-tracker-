"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, MapPin, CreditCard, Calendar, DollarSign } from "lucide-react"
import type { Statistics } from "@/lib/types"
import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/lib/language-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StatisticsPanelProps {
  statistics: Statistics | null
  onMonthChange?: (month: number) => void
}

export function StatisticsPanel({ statistics, onMonthChange }: StatisticsPanelProps) {
  const { t } = useLanguage()
  // Joriy oyni aniqlash (0-based index)
  const currentMonth = new Date().getMonth()
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth))

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
    // Katta raqamlar uchun qisqartirish
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + "B UZS"
    } else if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + "M UZS"
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + "K UZS"
    }
    
    return (
      new Intl.NumberFormat("uz-UZ", {
        style: "decimal",
        minimumFractionDigits: 0,
      }).format(amount) + " UZS"
    )
  }
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr))
  }
  // Generate calendar for a specific month
  const generateMonthDays = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const firstDayOfWeek = firstDayOfMonth.getDay() // 0 (Sunday) to 6 (Saturday)

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const startDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    // Create array of days, including padding
    const days: Array<{ date: number | null; checks: number }> = []

    // Add padding for days before the 1st
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, checks: 0 })
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const stat = statistics.dailyStats.find((s) => s.date === dateStr)
      days.push({ date: day, checks: stat ? stat.checks : 0 })
    }

    // Pad the end to complete the last week
    const totalDays = days.length
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7)
    for (let i = 0; i < remainingDays; i++) {
      days.push({ date: null, checks: 0 })
    }

    return days
  }

  // Generate month names for dropdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Intl.DateTimeFormat("uz-UZ", { month: "long" }).format(new Date(2025, i, 1))
    return {
      index: i,
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    }
  })
  // const months = Array.from({ length: 12 }, (_, i) => {
  //   // "uz-UZ" locale uchun to'liq oyni nomi
  //   const monthName = new Intl.DateTimeFormat("uz-UZ", { month: "long" }).format(new Date(2025, i, 1))
  //   return {
  //     index: i,
  //     name: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Masalan: "Iyul", "Avgust"
  //   }
  // })

  const totalPayments = statistics.paymentMethods
    ? Object.values(statistics.paymentMethods).reduce((sum, amount) => sum + amount, 0)
    : 0

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">{t('statistics')}</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-600">{t('total_checks')}</p>
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
                <p className="text-xs text-gray-600">{t('total_amount')}</p>
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
                <p className="text-xs text-gray-600">{t('today')}</p>
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
                <p className="text-xs text-gray-600">{t('success_rate')}</p>
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
{t('payment_methods')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statistics.paymentMethods).map(([method, amount]) => {
              const percentage = totalPayments > 0 ? (amount / totalPayments) * 100 : 0
              const methodLabels: Record<string, string> = {
                nalichniy: t('cash'),
                uzcard: t('uzcard'),
                humo: t('humo'),
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
       {/* Top Projects */}
       {statistics.topProjects && statistics.topProjects.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Eng yaxshi loyihalar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statistics.topProjects.slice(0, 3).map((project, index) => (
              <div key={project.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 text-xs p-1.5">
                    {index + 1}
                  </Badge>
                  <span className="font-medium truncate">{project.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{project.checkCount}</p>
                  <p className="text-gray-500">{formatCurrency(project.totalSum)}</p>
                </div>
              </div>
            ))}
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
                  <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 text-xs p-1.5">
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
                  <Badge variant={index === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 text-xs p-1.5">
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
     {/* Daily Stats */}
     {statistics.dailyStats && statistics.dailyStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Kunlik statistika (2025)
            </CardTitle>
            <Select value={selectedMonth} onValueChange={(value) => {
              setSelectedMonth(value)
              if (onMonthChange) {
                onMonthChange(parseInt(value))
              }
            }}>
              <SelectTrigger className="w-40 mt-2">
                <SelectValue placeholder="Oy tanlang" />
              </SelectTrigger>
              <SelectContent>
                {/* {Array.from({ length: 12 }, (_, i) => {
                  const monthName = new Intl.DateTimeFormat("uz-UZ", { month: "long" }).format(new Date(2025, i, 1))
                  return (
                    <SelectItem key={i} value={String(i)}>
                      {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                    </SelectItem>
                  )
                })} */}
                {Array.from({ length: 12 }, (_, i) => {
                  // "uz-UZ" locale uchun to'liq oyni nomi
                  const monthName = new Intl.DateTimeFormat("locales", { month: "long" }).format(new Date(2025, i, 1))
                  // Masalan: "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", ...
                  return (
                    <SelectItem key={i} value={String(i)}>
                      {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-xs text-center">
              {/* Weekday headers */}
              {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((day) => (
                <div key={day} className="font-medium text-gray-600">
                  {day}
                </div>
              ))}
              {/* Calendar days */}
              {generateMonthDays(2025, parseInt(selectedMonth)).map((day, index) => (
                <div
                  key={index}
                  className={`p-2 h-12 flex items-center justify-center border rounded ${
                    day.date ? "hover:bg-gray-100" : "bg-gray-50"
                  }`}
                >
                  {day.date ? (
                    <div className="flex flex-col items-center">
                      <span>{day.date}</span>
                      <Badge
                        variant={day.checks > 0 ? "default" : "secondary"}
                        className="mt-1 text-xs"
                      >
                        {day.checks}
                      </Badge>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
