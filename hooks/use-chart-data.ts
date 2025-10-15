import { useMemo } from "react"
import type { Statistics } from "@/lib/types"
import { useTranslation } from "../lib/simple-i18n"

interface ChartModes {
  dailyStats: 'count' | 'sum'
  hourlyStats: 'count' | 'sum'
  topExpeditors: 'count' | 'sum'
  topProjects: 'count' | 'sum'
  topCities: 'count' | 'sum'
  paymentMethods: 'count' | 'sum'
  warehouseDistribution: 'count' | 'sum'
}

interface UseChartDataProps {
  statistics: Statistics | null
  chartModes: ChartModes
  dailyGroupingMode: 'day' | 'week' | 'month'
}

export function useChartData({ statistics, chartModes, dailyGroupingMode }: UseChartDataProps) {
  const { t } = useTranslation()
  
  // Chart color palette
  const COLORS = [
    "#2563eb", "#059669", "#d97706", "#dc2626",
    "#7c3aed", "#db2777", "#4f46e5", "#0d9488"
  ]
  
  // Memoized daily chart data
  const dailyChartData = useMemo(() => {
    if (!statistics?.dailyStats) return []
    
    let processedData = statistics.dailyStats.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: new Date(d.date),
      checks: d.checks,
      sum: d.checks * (statistics.avgCheckSum || 0)
    }))
    
    // Group by week or month if needed
    if (dailyGroupingMode === 'week') {
      const groupedByWeek = new Map()
      processedData.forEach(d => {
        const weekStart = new Date(d.fullDate)
        weekStart.setDate(d.fullDate.getDate() - d.fullDate.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!groupedByWeek.has(weekKey)) {
          groupedByWeek.set(weekKey, {
            date: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            checks: 0,
            sum: 0,
            fullDate: weekStart
          })
        }
        
        const weekData = groupedByWeek.get(weekKey)
        weekData.checks += d.checks
        weekData.sum += d.sum
      })
      processedData = Array.from(groupedByWeek.values())
    } else if (dailyGroupingMode === 'month') {
      const groupedByMonth = new Map()
      processedData.forEach(d => {
        const monthKey = d.fullDate.toISOString().substring(0, 7)
        
        if (!groupedByMonth.has(monthKey)) {
          groupedByMonth.set(monthKey, {
            date: d.fullDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            checks: 0,
            sum: 0,
            fullDate: new Date(d.fullDate.getFullYear(), d.fullDate.getMonth(), 1)
          })
        }
        
        const monthData = groupedByMonth.get(monthKey)
        monthData.checks += d.checks
        monthData.sum += d.sum
      })
      processedData = Array.from(groupedByMonth.values()).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
    }
    
    return processedData
  }, [statistics?.dailyStats, statistics?.avgCheckSum, dailyGroupingMode])
  
  // Memoized hourly chart data
  const hourlyChartData = useMemo(() => {
    if (!statistics?.hourlyStats) return []
    return statistics.hourlyStats.map(h => ({
      hour: `${h.hour}:00`,
      checks: h.checks,
      sum: h.checks * (statistics.avgCheckSum || 0)
    }))
  }, [statistics?.hourlyStats, statistics?.avgCheckSum])
  
  // Memoized payment chart data
  const paymentChartData = useMemo(() => {
    if (!statistics?.paymentMethods) return []
    
    const paymentData = [
      { name: t('cash'), value: statistics.paymentMethods.nalichniy, color: COLORS[0] },
      { name: t('uzcard'), value: statistics.paymentMethods.uzcard, color: COLORS[1] },
      { name: t('humo'), value: statistics.paymentMethods.humo, color: COLORS[2] },
      { name: t('click'), value: statistics.paymentMethods.click, color: COLORS[3] },
    ].filter(item => item.value > 0)
    
    const total = paymentData.reduce((sum, item) => sum + item.value, 0)
    
    return paymentData.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
    }))
  }, [statistics?.paymentMethods, t])
  
  // Memoized expeditor chart data
  const expeditorChartData = useMemo(() => {
    if (!statistics?.topExpeditors) return []
    
    const sortedExpeditors = [...statistics.topExpeditors].sort((a, b) => {
      return chartModes.topExpeditors === 'sum' 
        ? (b.totalSum || 0) - (a.totalSum || 0)
        : (b.checkCount || 0) - (a.checkCount || 0)
    })
    
    return sortedExpeditors.slice(0, 10).map(exp => ({
      name: exp.name.length > 15 ? exp.name.substring(0, 15) + '...' : exp.name,
      fullName: exp.name,
      checks: exp.checkCount,
      sum: exp.totalSum || 0
    }))
  }, [statistics?.topExpeditors, chartModes.topExpeditors])
  
  // Memoized project chart data
  const projectChartData = useMemo(() => {
    if (!statistics?.topProjects) return []
    
    const sortedProjects = [...statistics.topProjects].sort((a, b) => {
      return chartModes.topProjects === 'sum' 
        ? (b.totalSum || 0) - (a.totalSum || 0)
        : (b.checkCount || 0) - (a.checkCount || 0)
    })
    
    return sortedProjects.slice(0, 8).map(proj => ({
      name: proj.name.length > 12 ? proj.name.substring(0, 12) + '...' : proj.name,
      fullName: proj.name,
      checks: proj.checkCount,
      sum: proj.totalSum || 0
    }))
  }, [statistics?.topProjects, chartModes.topProjects])
  
  // Memoized city chart data
  const cityChartData = useMemo(() => {
    if (!statistics?.topCities) return []
    
    const sortedCities = [...statistics.topCities].sort((a, b) => {
      return chartModes.topCities === 'sum' 
        ? (b.totalSum || 0) - (a.totalSum || 0)
        : (b.checkCount || 0) - (a.checkCount || 0)
    })
    
    return sortedCities.slice(0, 8).map(city => ({
      name: city.name.length > 12 ? city.name.substring(0, 12) + '...' : city.name,
      fullName: city.name,
      checks: city.checkCount,
      sum: city.totalSum || 0
    }))
  }, [statistics?.topCities, chartModes.topCities])
  
  // Memoized warehouse chart data
  const warehouseChartData = useMemo(() => {
    if (!statistics?.topSklads) return []
    
    const sortedSklads = [...statistics.topSklads].sort((a, b) => {
      return chartModes.warehouseDistribution === 'sum' 
        ? (b.totalSum || 0) - (a.totalSum || 0)
        : (b.checkCount || 0) - (a.checkCount || 0)
    })
    
    return sortedSklads.slice(0, 8).map(sklad => ({
      name: sklad.name.length > 12 ? sklad.name.substring(0, 12) + '...' : sklad.name,
      fullName: sklad.name,
      checks: sklad.checkCount,
      sum: sklad.totalSum || 0
    }))
  }, [statistics?.topSklads, chartModes.warehouseDistribution])
  
  return {
    dailyChartData,
    hourlyChartData,
    paymentChartData,
    expeditorChartData,
    projectChartData,
    cityChartData,
    warehouseChartData,
    COLORS
  }
}
