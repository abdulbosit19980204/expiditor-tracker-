import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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

interface UseAnalyticsDataReturn {
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
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEBOUNCE_DELAY = 300 // 300ms

export function useAnalyticsData(): UseAnalyticsDataReturn {
  // State
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filials, setFilials] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filters state
  const [filters, setFilters] = useState<FilterState>(() => ({
    dateRange: getCurrentMonthRange(),
    project: "",
    sklad: "",
    city: "",
    filial: "",
    status: "",
  }))
  
  // Refs for optimization
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()
  
  // Helper function
  function getCurrentMonthRange() {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: firstDay, to: lastDay }
  }
  
  // Cache management
  const getCachedData = useCallback((key: string) => {
    const cached = cacheRef.current.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [])
  
  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() })
  }, [])
  
  // Load initial data (projects, sklads, cities, filials)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        // Check cache first
        const cacheKey = 'initial-data'
        const cached = getCachedData(cacheKey)
        
        if (cached) {
          const { projects: cachedProjects, sklads: cachedSklads, cities: cachedCities, filials: cachedFilials } = cached
          setProjects(cachedProjects)
          setSklads(cachedSklads)
          setCities(cachedCities)
          setFilials(cachedFilials)
          setLoading(false)
          return
        }
        
        // Fetch fresh data
        const [projectsData, skladsData, citiesData, filialsData] = await Promise.all([
          api.getProjects(),
          api.getSklads(),
          api.getCities(),
          api.getFilials(),
        ])
        
        // Cache the data
        setCachedData(cacheKey, {
          projects: projectsData,
          sklads: skladsData,
          cities: citiesData,
          filials: filialsData,
        })
        
        setProjects(projectsData)
        setSklads(skladsData)
        setCities(citiesData)
        setFilials(filialsData)
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [getCachedData, setCachedData])
  
  // Load statistics with debouncing and caching
  const loadStatistics = useCallback(async (filterParams: FilterState, forceRefresh = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    setIsRefreshing(true)
    
    try {
      // Create cache key from filters
      const cacheKey = `statistics-${JSON.stringify(filterParams)}`
      
      // Check cache unless force refresh
      if (!forceRefresh) {
        const cached = getCachedData(cacheKey)
        if (cached) {
          setStatistics(cached)
          setIsRefreshing(false)
          return
        }
      }
      
      const backendFilters = {
        dateRange: filterParams.dateRange,
        project: filterParams.project,
        sklad: filterParams.sklad,
        city: filterParams.city,
        status: filterParams.status,
      }
      
      const statisticsData = await api.getGlobalStatistics(backendFilters)
      
      // Cache the result
      setCachedData(cacheKey, statisticsData)
      setStatistics(statisticsData)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error loading statistics:", error)
        setStatistics(null)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [getCachedData, setCachedData])
  
  // Debounced statistics loading
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      loadStatistics(filters)
    }, DEBOUNCE_DELAY)
    
    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [filters, loadStatistics])
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      dateRange: getCurrentMonthRange(),
      project: "",
      sklad: "",
      city: "",
      filial: "",
      status: "",
    })
  }, [])
  
  // Manual refresh
  const refreshData = useCallback(async () => {
    await loadStatistics(filters, true) // Force refresh
  }, [filters, loadStatistics])
  
  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.project) count++
    if (filters.sklad) count++
    if (filters.city) count++
    if (filters.filial) count++
    if (filters.status) count++
    return count
  }, [filters])
  
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
    // Data
    statistics,
    projects,
    sklads,
    cities,
    filials,
    
    // Loading states
    loading,
    isRefreshing,
    
    // Actions
    updateFilters,
    clearAllFilters,
    refreshData,
    
    // Computed
    activeFiltersCount,
  }
}
