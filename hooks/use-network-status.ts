"use client"

import { useState, useEffect } from "react"

interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType?: string
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isSlowConnection: false,
  })

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === "undefined") return

    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine
      
      // Check connection speed if available
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      const isSlowConnection = connection ? 
        connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false
      
      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType: connection?.effectiveType || 'unknown'
      })
    }

    // Initial check
    updateNetworkStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Listen for connection changes
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [])

  return networkStatus
}
