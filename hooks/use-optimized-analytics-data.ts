"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { api } from "@/lib/api"
import type { Statistics, Project, Sklad, City, Filial } from "@/lib/types"

interface FilterState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  project: string
  sklad: string
  city: string
  filial: string
  status: string
}

interface UseOptimizedAnalyticsDataReturn {
  // Data
  statistics: Statistics | null
  projects: Project[]
  sklads: Sklad[]
  cities: City[]
  filials: Filial[]
  
  // Loading states
  loading: boolean
  isRefreshing: boolean
  
  // Actions
  updateFilters: (filters: Partial<FilterState>) => void
  clearAllFilters: () => void
  refreshData: () => Promise<void>
  
  // Computed
  activeFiltersCount: number
  filters: FilterState
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEBOUNCE_DELAY = 300 // 300ms

// Helper function to get current month range (memoized)
const getCurrentMonthRange = (() => {
  let cachedRange: { from: Date; to: Date } | null = null
  let lastMonth = -1
  
  return () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    
    // Only recalculate if month changed
    if (cachedRange === null || lastMonth !== currentMonth) {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      cachedRange = { from: firstDay, to: lastDay }
      lastMonth = currentMonth
    }
    
    return cachedRange
  }
})()

export function useOptimizedAnalyticsData(): UseOptimizedAnalyticsDataReturn {
  // State
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filials, setFilials] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filters state (memoized initial value)
  const initialFilters = useMemo(() => ({
    dateRange: getCurrentMonthRange(),
    project: "",
    sklad: "",
    city: "",
    filial: "",
    status: "",
  }), [])
  
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  
  // Cache and debounce refs
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Computed active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.project) count++
    if (filters.sklad) count++
    if (filters.city) count++
    if (filters.filial) count++
    if (filters.status) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    return count
  }, [filters])

  // Memoized API parameters
  const apiParams = useMemo(() => {
    const params = new URLSearchParams()
    
    if (filters.dateRange.from) {
      params.append('date_from', filters.dateRange.from.toISOString().split('T')[0])
    }
    if (filters.dateRange.to) {
      params.append('date_to', filters.dateRange.to.toISOString().split('T')[0])
    }
    if (filters.project) {
      params.append('project', filters.project)
    }
    if (filters.sklad) {
      params.append('sklad', filters.sklad)
    }
    if (filters.city) {
      params.append('city', filters.city)
    }
    if (filters.filial) {
      params.append('filial', filters.filial)
    }
    if (filters.status) {
      params.append('status', filters.status)
    }
    
    return params.toString()
  }, [filters])

  // Create cache key
  const cacheKey = `analytics_${apiParams}`

  // Check cache validity
  const getCachedData = useCallback((key: string) => {
    const cached = cacheRef.current.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    cacheRef.current.delete(key)
    return null
  }, [])

  // Set cache data
  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    })
  }, [])

  // Debounced data fetching function
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedData(cacheKey)
      if (cached) {
        setStatistics(cached.statistics)
        setProjects(cached.projects || [])
        setSklads(cached.sklads || [])
        setCities(cached.cities || [])
        setFilials(cached.filials || [])
        setLoading(false)
        setIsRefreshing(false)
        return
      }
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    try {
      if (loading && !isRefreshing) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      // Fetch data with abort signal
      const [statisticsResponse, projectsResponse, skladsResponse, citiesResponse, filialsResponse] = await Promise.all([
        api.getStatistics(apiParams, abortControllerRef.current.signal),
        api.getProjects(abortControllerRef.current.signal),
        api.getSklads(abortControllerRef.current.signal),
        api.getCities(abortControllerRef.current.signal),
        api.getFilials(abortControllerRef.current.signal)
      ])

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return
      }

      const data = {
        statistics: statisticsResponse,
        projects: projectsResponse || [],
        sklads: skladsResponse || [],
        cities: citiesResponse || [],
        filials: filialsResponse || []
      }

      // Update state
      setStatistics(data.statistics)
      setProjects(data.projects)
      setSklads(data.sklads)
      setCities(data.cities)
      setFilials(data.filials)

      // Cache the data
      setCachedData(cacheKey, data)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      
      console.error('[OptimizedAnalytics] Error fetching data:', error)
      
      // Set fallback data
      setStatistics(null)
      setProjects([])
      setSklads([])
      setCities([])
      setFilials([])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [apiParams, cacheKey, getCachedData, setCachedData, loading, isRefreshing])

  // Debounced filter update
  const debouncedFetchData = useCallback((forceRefresh = false) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchData(forceRefresh)
    }, DEBOUNCE_DELAY)
  }, [fetchData])

  // Update filters with debouncing
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters }
      
      // Only trigger fetch if filters actually changed
      const hasChanges = Object.keys(newFilters).some(key => {
        const typedKey = key as keyof FilterState
        return prev[typedKey] !== updated[typedKey]
      })
      
      if (hasChanges) {
        debouncedFetchData()
      }
      
      return updated
    })
  }, [debouncedFetchData])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters)
    debouncedFetchData()
  }, [initialFilters, debouncedFetchData])

  // Manual refresh
  const refreshData = useCallback(async () => {
    await fetchData(true) // Force refresh
  }, [fetchData])

  // Initial data load
  useEffect(() => {
    fetchData()
  }, []) // Only run on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    statistics,
    projects,
    sklads,
    cities,
    filials,
    loading,
    isRefreshing,
    updateFilters,
    clearAllFilters,
    refreshData,
    activeFiltersCount,
    filters
  }
}
