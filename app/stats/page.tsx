"use client"
import type { Statistics } from "@/lib/types"
import { useState, useEffect } from "react"
import { Suspense } from "react"
import StatsContent from "./stats-content"
import { Skeleton } from "@/components/ui/skeleton"

function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: firstDay, to: lastDay }
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// CSV Export function
const exportToCSV = (stats: Statistics, filters: any) => {
  const csvData = [
    ["Metric", "Value"],
    ["Total Checks", stats.totalChecks],
    ["Delivered Checks", stats.deliveredChecks],
    ["Failed Checks", stats.failedChecks],
    ["Pending Checks", stats.pendingChecks],
    ["Total Sum (UZS)", stats.totalSum],
    ["Average Check Sum (UZS)", stats.avgCheckSum || 0],
    ["Success Rate (%)", stats.successRate],
    ["", ""],
    ["Payment Methods", ""],
    ["Cash", stats.paymentMethods.nalichniy],
    ["UzCard", stats.paymentMethods.uzcard],
    ["Humo", stats.paymentMethods.humo],
    ["Click", stats.paymentMethods.click],
    ["", ""],
    ["Top Expeditors", ""],
    ...stats.topExpeditors.map((exp) => [exp.name, exp.checkCount]),
    ["", ""],
    ["Top Projects", ""],
    ...stats.topProjects.map((proj) => [proj.name, proj.checkCount]),
    ["", ""],
    ["Top Cities", ""],
    ...stats.topCities.map((city) => [city.name, city.checkCount]),
    ["", ""],
    ["Top Warehouses", ""],
    ...(stats.topSklads || []).map((sklad) => [sklad.name, sklad.checkCount]),
  ]

  const csvContent = csvData.map((row) => row.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `statistics_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function StatsPageSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={<StatsPageSkeleton />}>
      <StatsContent />
    </Suspense>
  )
}
