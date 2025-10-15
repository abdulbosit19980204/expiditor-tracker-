"use client"

import React, { memo } from "react"

// Memoized tooltip components to prevent unnecessary re-renders
export const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
})

CustomTooltip.displayName = "CustomTooltip"

export const ExpeditorTooltip = memo(({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  
  const data = payload[0]?.payload
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 dark:text-gray-100">{data?.fullName || label}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Check Count: <span className="font-medium">{data?.checks?.toLocaleString()}</span>
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Total Sum: <span className="font-medium">{formatCurrency(data?.sum || 0)}</span>
      </p>
    </div>
  )
})

ExpeditorTooltip.displayName = "ExpeditorTooltip"

export const PaymentTooltip = memo(({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  
  const data = payload[0]?.payload
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 dark:text-gray-100">{data?.name}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Amount: <span className="font-medium">{formatCurrency(data?.value || 0)}</span>
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Percentage: <span className="font-medium">{data?.percentage}%</span>
      </p>
    </div>
  )
})

PaymentTooltip.displayName = "PaymentTooltip"

// Helper function for currency formatting
function formatCurrency(n: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
  }).format(Math.round(n || 0))
}
