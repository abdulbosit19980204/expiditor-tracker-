"use client"

import React, { memo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity 
} from "lucide-react"
import type { Statistics } from "@/lib/types"
import { useTranslation } from "../../lib/simple-i18n"

interface MemoizedMetricsCardsProps {
  statistics: Statistics | null
}

const MemoizedMetricsCards = memo<MemoizedMetricsCardsProps>(({ statistics }) => {
  const { t } = useTranslation()
  
  // Memoized formatters to prevent recreation on every render
  const formatNumber = useCallback((n: number) => {
    return new Intl.NumberFormat("uz-UZ").format(Math.round(n || 0))
  }, [])
  
  const formatCurrency = useCallback((n: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(Math.round(n || 0))
  }, [])
  
  if (!statistics) return null
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-100">
            {t('totalChecks')}
          </CardTitle>
          <Package className="h-4 w-4 text-blue-200" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(statistics.totalChecks)}</div>
          <p className="text-xs text-blue-200">
            {t('allExpeditorChecks')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-100">
            {t('totalSum')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-200" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.totalSum)}</div>
          <p className="text-xs text-green-200">
            {t('totalCheckValue')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-100">
            {t('avgCheckSum')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-200" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.avgCheckSum || 0)}</div>
          <p className="text-xs text-purple-200">
            {t('perCheckAverage')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-100">
            {t('deliverySuccessRate')}
          </CardTitle>
          <Activity className="h-4 w-4 text-orange-200" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</div>
          <p className="text-xs text-orange-200">
            {t('successfulDeliveries')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
})

MemoizedMetricsCards.displayName = "MemoizedMetricsCards"

export default MemoizedMetricsCards
