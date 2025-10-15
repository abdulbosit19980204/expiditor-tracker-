"use client"

import { useEffect, useState } from "react"
import { AlertCircle, X, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ErrorToastProps {
  error: {
    message: string
    status?: number
    isNetworkError: boolean
  } | null
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorToast({ error, onRetry, onDismiss }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      // Auto dismiss after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [error, onDismiss])

  if (!error || !isVisible) return null

  const getErrorIcon = () => {
    if (error.isNetworkError) {
      return <WifiOff className="h-5 w-5 text-red-500" />
    }
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  const getErrorTitle = () => {
    if (error.isNetworkError) {
      return "Internet aloqasi uzildi"
    }
    if (error.status === 500) {
      return "Server xatoligi"
    }
    if (error.status === 404) {
      return "Ma'lumot topilmadi"
    }
    return "Xatolik yuz berdi"
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {getErrorIcon()}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                {getErrorTitle()}
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error.message}
              </p>
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
                  onClick={() => {
                    onRetry()
                    setIsVisible(false)
                  }}
                >
                  Qayta urinish
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-700 p-1"
              onClick={() => {
                setIsVisible(false)
                onDismiss?.()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
