"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Search, Users, MapPin, Filter, ChevronDown, ChevronUp, X, Menu, BarChart3, RefreshCw, Loader2, Send, Clock, Home, ArrowLeft, Key, LogOut, User } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/loading-spinner"
import { MapComponent } from "@/components/map-component"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { CheckModal } from "@/components/check-modal"
import { StatisticsPanel } from "@/components/statistics-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import type { Check, Expeditor, Project, Sklad, City, Statistics, Filial } from "@/lib/types"
import { api, analytics } from "@/lib/api"

interface FilterState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  project: string
  sklad: string
  city: string
  filial: string
  status: string
}

// Helper function to get current month's first and last day
function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: firstDay, to: lastDay }
}

export default function ExpeditorTracker() {
  const isMobile = useIsMobile()
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  // State management
  const [checks, setChecks] = useState<Check[]>([])
  const [expeditors, setExpeditors] = useState<Expeditor[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filials, setFilials] = useState<Filial[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null)
  const [selectedExpeditor, setSelectedExpeditor] = useState<Expeditor | null>(null)
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false)
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; checkId?: string } | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingChecks, setIsLoadingChecks] = useState(false)
  const [isLoadingExpeditors, setIsLoadingExpeditors] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expeditorSearchQuery, setExpeditorSearchQuery] = useState("")
  const [checkSearchQuery, setCheckSearchQuery] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(0)
  const [updateMessage, setUpdateMessage] = useState("")
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [showMainStats, setShowMainStats] = useState(false)

  // Initialize filters with current month as default
  const [filters, setFilters] = useState<FilterState>(() => ({
    dateRange: getCurrentMonthRange(),
    project: "",
    sklad: "",
    city: "",
    filial: "",
    status: "",
  }))

  const handleOpenTelegram = useCallback(async () => {
    try {
      const info = await analytics.getTelegramTarget()
      if (info && info.url) {
        window.open(info.url, "_blank")
      } else {
        window.open("https://t.me/", "_blank")
      }
    } catch {
      window.open("https://t.me/", "_blank")
    }
  }, [])

  // Persist and show last update time
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const v = window.localStorage.getItem("exp_last_updated_at")
      if (v) setLastUpdatedAt(v)
      
      // Check if stats should be shown (from navigation)
      const showStats = window.localStorage.getItem("show_main_stats")
      if (showStats === "true") {
        setShowMainStats(true)
        window.localStorage.removeItem("show_main_stats") // Remove after reading
      }
      
      // Load saved stats panel state
      const savedStatsState = window.localStorage.getItem("main_stats_panel_open")
      if (savedStatsState === "true") {
        setShowMainStats(true)
      }
      
    } catch {}
    // Also fetch from server-side persisted file in case localStorage is empty
    fetch("/api/last-updated", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && j.timestamp && !lastUpdatedAt) setLastUpdatedAt(j.timestamp)
      })
      .catch(() => {})
  }, [])
  
  // Save stats panel state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem("main_stats_panel_open", String(showMainStats))
    } catch {}
  }, [showMainStats])

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined" || !user?.username) return
    try {
      window.localStorage.setItem(`user_filters_${user.username}`, JSON.stringify(filters))
    } catch (error) {
      console.error('Error saving filters:', error)
    }
  }, [filters, user?.username])

  // Save selected expeditor to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined" || !user?.username) return
    try {
      if (selectedExpeditor) {
        window.localStorage.setItem(`user_selected_expeditor_${user.username}`, JSON.stringify(selectedExpeditor))
      } else {
        window.localStorage.removeItem(`user_selected_expeditor_${user.username}`)
      }
    } catch (error) {
      console.error('Error saving selected expeditor:', error)
    }
  }, [selectedExpeditor, user?.username])
  
  // Listen for toggle event from navigation
  useEffect(() => {
    const handleToggleStats = () => {
      const newState = localStorage.getItem('main_stats_panel_open') === 'true'
      setShowMainStats(newState)
    }
    
    window.addEventListener('toggle-main-stats', handleToggleStats)
    return () => window.removeEventListener('toggle-main-stats', handleToggleStats)
  }, [])

  const formatDateTime = useCallback((iso: string | null | undefined) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) {
        return iso
      }
      return d.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', iso)
      return iso
    }
  }, [])

  // Load initial data (only once)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingInitial(true)
      try {
        const [projectsData, skladsData, citiesData, filialsData] = await Promise.all([
          api.getProjects(),
          api.getSklads(),
          api.getCities(),
          api.getFilials(),
        ])

        setProjects(projectsData)
        setSklads(skladsData)
        setCities(citiesData)
        setFilials(filialsData)
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setIsLoadingInitial(false)
      }
    }

    loadInitialData()
  }, [])

  // Load saved filters when user changes or page loads
  useEffect(() => {
    if (!user?.username || isLoadingInitial) return

    const loadSavedFilters = async () => {
      try {
        // Load saved filters and selected expeditor for this user
        const savedFilters = window.localStorage.getItem(`user_filters_${user.username}`)
        const savedExpeditor = window.localStorage.getItem(`user_selected_expeditor_${user.username}`)
        
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters)
          
          // Convert date strings back to Date objects
          if (parsedFilters.dateRange) {
            if (parsedFilters.dateRange.from && typeof parsedFilters.dateRange.from === 'string') {
              parsedFilters.dateRange.from = new Date(parsedFilters.dateRange.from)
            }
            if (parsedFilters.dateRange.to && typeof parsedFilters.dateRange.to === 'string') {
              parsedFilters.dateRange.to = new Date(parsedFilters.dateRange.to)
            }
          }
          
          setFilters(parsedFilters)
          
          // Load saved expeditor if available
          if (savedExpeditor) {
            try {
              const parsedExpeditor = JSON.parse(savedExpeditor)
              setSelectedExpeditor(parsedExpeditor)
            } catch (error) {
              console.error('Error parsing saved expeditor:', error)
            }
          }
          
          // Load expeditors for the saved filial and restore data
          if (parsedFilters.filial) {
            try {
              const expeditorsData = await api.getExpeditors(parsedFilters.filial, true)
              setExpeditors(expeditorsData)
              
              // If we have a saved expeditor, try to find it in the loaded expeditors
              if (savedExpeditor) {
                try {
                  const parsedExpeditor = JSON.parse(savedExpeditor)
                  const foundExpeditor = expeditorsData.find(e => e.id === parsedExpeditor.id)
                  if (foundExpeditor) {
                    setSelectedExpeditor(foundExpeditor)
                  } else if (expeditorsData.length > 0) {
                    setSelectedExpeditor(expeditorsData[0])
                  }
                } catch (error) {
                  console.error('Error parsing saved expeditor:', error)
                  if (expeditorsData.length > 0) {
                    setSelectedExpeditor(expeditorsData[0])
                  }
                }
              } else if (expeditorsData.length > 0) {
                setSelectedExpeditor(expeditorsData[0])
              }
            } catch (error) {
              console.error("Error loading expeditors after filter restore:", error)
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved filters:', error)
      }
    }

    loadSavedFilters()
  }, [user?.username, isLoadingInitial])

  // Reload filters when page becomes visible (handles page refresh, navigation back, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.username && !isLoadingInitial) {
        // Reload saved filters when page becomes visible
        const savedFilters = window.localStorage.getItem(`user_filters_${user.username}`)
        const savedExpeditor = window.localStorage.getItem(`user_selected_expeditor_${user.username}`)
        
        if (savedFilters) {
          try {
            const parsedFilters = JSON.parse(savedFilters)
            
            // Convert date strings back to Date objects
            if (parsedFilters.dateRange) {
              if (parsedFilters.dateRange.from && typeof parsedFilters.dateRange.from === 'string') {
                parsedFilters.dateRange.from = new Date(parsedFilters.dateRange.from)
              }
              if (parsedFilters.dateRange.to && typeof parsedFilters.dateRange.to === 'string') {
                parsedFilters.dateRange.to = new Date(parsedFilters.dateRange.to)
              }
            }
            
            setFilters(parsedFilters)
            
            // Load saved expeditor if available
            if (savedExpeditor) {
              try {
                const parsedExpeditor = JSON.parse(savedExpeditor)
                setSelectedExpeditor(parsedExpeditor)
              } catch (error) {
                console.error('Error parsing saved expeditor on visibility change:', error)
              }
            }
          } catch (error) {
            console.error('Error reloading saved filters on visibility change:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [user?.username, isLoadingInitial])

  // Load expeditors when filial filter changes
  useEffect(() => {
    const loadExpeditors = async () => {
      setIsLoadingExpeditors(true)
      try {
        // Only load expeditors with checks
        const expeditorsData = await api.getExpeditors(filters.filial, true)
        setExpeditors(expeditorsData)

        // Auto-select first expeditor if available and no current selection
        if (expeditorsData.length > 0 && !selectedExpeditor) {
          setSelectedExpeditor(expeditorsData[0])
        }

        // Clear selected expeditor if it's not in the new list
        if (selectedExpeditor && !expeditorsData.find((e) => e.id === selectedExpeditor.id)) {
          setSelectedExpeditor(expeditorsData[0] || null)
        }
      } catch (error) {
        console.error("Error loading expeditors:", error)
        setExpeditors([])
      } finally {
        setIsLoadingExpeditors(false)
      }
    }

    loadExpeditors()
  }, [filters.filial])

  // Load checks and statistics when expeditor or other filters change
  useEffect(() => {
    const loadChecksAndStats = async () => {
      if (!selectedExpeditor) {
        setChecks([])
        setStatistics(null)
        return
      }

      setIsLoadingChecks(true)
      try {
        const backendFilters = {
          expeditor_id: selectedExpeditor.id,
          dateRange: filters.dateRange,
          project: filters.project,
          sklad: filters.sklad,
          city: filters.city,
          status: filters.status,
          search: checkSearchQuery,
        }

        const [checksData, statisticsData] = await Promise.all([
          api.getChecks(backendFilters),
          api.getStatistics(backendFilters),
        ])

        setChecks(checksData)
        setStatistics(statisticsData)
      } catch (error) {
        console.error("Error loading checks and statistics:", error)
        setChecks([])
        setStatistics(null)
      } finally {
        setIsLoadingChecks(false)
      }
    }

    loadChecksAndStats()
  }, [selectedExpeditor, filters, checkSearchQuery])

  // Optimized filter expeditors by search query with better memoization
  const filteredExpeditors = useMemo(() => {
    if (!expeditorSearchQuery.trim()) return expeditors

    const searchLower = expeditorSearchQuery.toLowerCase().trim()
    return expeditors.filter(
      (expeditor) =>
        expeditor.name?.toLowerCase().includes(searchLower) ||
        expeditor.phone_number?.includes(searchLower) ||
        expeditor.transport_number?.toLowerCase().includes(searchLower),
    )
  }, [expeditors, expeditorSearchQuery])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.project) count++
    if (filters.sklad) count++
    if (filters.city) count++
    if (filters.filial) count++
    if (filters.status) count++
    // Don't count date range as it's always set
    return count
  }, [filters])

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
    setCheckSearchQuery("")
    setExpeditorSearchQuery("")
  }, [])

  // Handle check click
  const handleCheckClick = useCallback((check: Check) => {
    setSelectedCheck(check)
    setIsCheckModalOpen(true)
  }, [])

  // Handle show location
  const handleShowLocation = useCallback((check: Check) => {
    if (check.check_lat && check.check_lon) {
      setFocusLocation({ lat: check.check_lat, lng: check.check_lon, checkId: check.check_id })
    }
  }, [])

  // Trigger backend update with visual progress
  const handleUpdate = useCallback(async () => {
    if (isUpdating) return
    setIsUpdating(true)
    setUpdateProgress(0)
    setUpdateMessage("Starting update…")

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"
    const steps: { key: string; label: string }[] = [
      { key: "checks", label: "Checks" },
      { key: "details", label: "Check details" },
      { key: "expeditors", label: "Expeditors" },
    ]

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        setUpdateMessage(`Updating ${step.label}…`)

        // Backend accepts GET; we pass a hinting param if ignored it's still safe
        const res = await fetch(`${API_BASE_URL}/update-checks/${i === 0 ? "" : ""}?part=${step.key}`, {
          method: "GET",
          headers: { "Accept": "application/json" },
        }).catch(() => {})

        // If server returns JSON with counts, show as toast update line-by-line
        try {
          if (res && res.ok) {
            const ct = res.headers.get("content-type") || ""
            if (ct.includes("application/json")) {
              const body = await res.json().catch(() => null)
              if (body && (body.created || body.updated)) {
                toast({
                  title: `${step.label} updated`,
                  description: `Created: ${body.created || 0}, Updated: ${body.updated || 0}`,
                  variant: "success" as any,
                })
              }
            }
          }
        } catch (_) {}

        setUpdateProgress(Math.round(((i + 1) / steps.length) * 100))
      }

      // Refresh visible data after update completes
      try {
        const backendFilters = selectedExpeditor
          ? {
              expeditor_id: selectedExpeditor.id,
              dateRange: filters.dateRange,
              project: filters.project,
              sklad: filters.sklad,
              city: filters.city,
              status: filters.status,
              search: checkSearchQuery,
            }
          : null

        // Reload reference datasets in the background
        const reloadBasics = Promise.all([
          api.getProjects().then(setProjects).catch(() => {}),
          api.getSklads().then(setSklads).catch(() => {}),
          api.getCities().then(setCities).catch(() => {}),
          api.getFilials().then(setFilials).catch(() => {}),
        ])

        if (backendFilters) {
          const [checksData, statisticsData] = await Promise.all([
            api.getChecks(backendFilters),
            api.getStatistics(backendFilters),
          ])
          setChecks(checksData)
          setStatistics(statisticsData)
        }

        await reloadBasics
      } catch (_) {
        // ignore refresh errors
      }

      setUpdateMessage("Completed")
      const ts = new Date().toISOString()
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("exp_last_updated_at", ts)
        }
      } catch {}
      setLastUpdatedAt(ts)
      // Persist to a txt file via a lightweight API route
      try {
        fetch("/api/last-updated", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timestamp: ts }), cache: "no-store" })
      } catch {}
      toast({ title: "Success", description: "Checks, details, expeditors updated", variant: "success" as any })
      // Force-refresh data without user interaction so the page shows fresh info
      // Soft refresh: re-run initial loaders
      try {
        if (typeof window !== "undefined") {
          // Give users time to read the toast before reload
          setTimeout(() => window.location.reload(), 3000)
        }
      } catch {}
    } finally {
      setTimeout(() => {
        setIsUpdating(false)
        setUpdateMessage("")
        setUpdateProgress(0)
      }, 3000)
    }
  }, [isUpdating, selectedExpeditor, filters, checkSearchQuery])

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("uz-UZ", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " UZS"
  }, [])

  // Handle expeditor selection
  const handleExpeditorSelect = useCallback(
    (expeditor: Expeditor) => {
      setSelectedExpeditor(expeditor)
      if (isMobile) {
        setIsSidebarOpen(false)
      }
    },
    [isMobile],
  )

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {isMobile && (
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('expeditor_tracker')}
            </h1>
            <div className="flex items-center gap-3">
              {/* User Profile with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto p-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-xs text-gray-600 leading-tight">
                      {user?.first_name} {user?.last_name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Inline small progress with message */}
              {isUpdating && (
                <div className="hidden sm:flex items-center gap-2 min-w-[200px]">
                  <span className="text-xs text-gray-600 truncate max-w-[120px]">{updateMessage}</span>
                  <div className="w-24"><Progress value={updateProgress} className="h-2" /></div>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleUpdate} title="Update data" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              {/* Hide Analytics and Tasks buttons on mobile */}
              {!isMobile && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" title="Analytics">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href="/analytics" className="cursor-pointer">
                          Enhanced Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/buzilishlar" className="cursor-pointer">
                          Buzilishlar Nazorati
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/violation-analytics" className="cursor-pointer">
                          Violation Analytics (Old)
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {user?.is_superuser && (
                    <Link href="/tasks" className="inline-flex">
                      <Button variant="outline" size="sm" title="Task Management">
                        <Clock className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleOpenTelegram} title="Telegram">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {lastUpdatedAt && (
              <div className="text-[11px] text-gray-500 mt-1">
                Last update: <span className="font-medium">{formatDateTime(lastUpdatedAt)}</span>
              </div>
            )}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="h-full flex flex-col">
                  <div className="p-3 border-b border-gray-200">
                    {/* Compact header with title and user */}
                    <div className="flex items-center justify-between mb-3">
                      <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t('expeditor_tracker')}
                      </h1>
                      
                      {/* User Profile - compact */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <User className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">
                              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <div className="px-2 py-1.5 text-sm font-medium border-b">
                            {user?.first_name} {user?.last_name}
                          </div>
                          <DropdownMenuItem onClick={logout} className="text-red-600">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Update button */}
                    <div className="mb-3">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleUpdate} 
                        disabled={isUpdating} 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            <span className="text-xs">{updateMessage}</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 mr-2" />
{t('update_data')}
                          </>
                        )}
                      </Button>
                      {lastUpdatedAt && !isUpdating && (
                        <p className="text-xs text-gray-500 text-center mt-1">
{t('last_update')}: {lastUpdatedAt}
                        </p>
                      )}
                    </div>
                    
                    {/* Update progress - compact */}
                    {isUpdating && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-700 truncate">{updateMessage}</span>
                        </div>
                        <Progress value={updateProgress} className="h-1.5" />
                      </div>
                    )}

                    {/* Date Range Filter */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">{t('date_range')}</label>
                      <DatePickerWithRange
                        dateRange={filters.dateRange}
                        onDateRangeChange={(range) => handleFilterChange("dateRange", range || getCurrentMonthRange())}
                      />
                    </div>

                    {/* Advanced Filters Toggle */}
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="w-full justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
{t('filter')}
                          {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {activeFiltersCount}
                            </Badge>
                          )}
                        </div>
                        {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>

                      {isFiltersOpen && (
                        <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                          {/* Filial Filter */}
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{t('filial')}</label>
                            <Select
                              value={filters.filial || "all"}
                              onValueChange={(value) => handleFilterChange("filial", value === "all" ? "" : value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder={t('all_filials')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_filials')}</SelectItem>
                                {filials.map((filial) => (
                                  <SelectItem key={filial.id} value={String(filial.id)}>
                                    {filial.filial_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Project Filter */}
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{t('project')}</label>
                            <Select
                              value={filters.project || "all"}
                              onValueChange={(value) => handleFilterChange("project", value === "all" ? "" : value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder={t('all_projects')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_projects')}</SelectItem>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.project_name}>
                                    {project.project_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Sklad Filter */}
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{t('warehouse')}</label>
                            <Select
                              value={filters.sklad || "all"}
                              onValueChange={(value) => handleFilterChange("sklad", value === "all" ? "" : value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder={t('all_warehouses')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_warehouses')}</SelectItem>
                                {sklads.map((sklad) => (
                                  <SelectItem key={sklad.id} value={sklad.sklad_name}>
                                    {sklad.sklad_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* City Filter */}
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{t('city')}</label>
                            <Select
                              value={filters.city || "all"}
                              onValueChange={(value) => handleFilterChange("city", value === "all" ? "" : value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder={t('all_cities')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_cities')}</SelectItem>
                                {cities.map((city) => (
                                  <SelectItem key={city.id} value={city.city_name}>
                                    {city.city_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Status Filter */}
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">{t('status')}</label>
                            <Select
                              value={filters.status || "all"}
                              onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder={t('all_statuses')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_statuses')}</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {activeFiltersCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearAllFilters}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
{t('clear_all_filters')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Expeditor Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                      <Input
placeholder={t('search_expeditors')}
                        value={expeditorSearchQuery}
                        onChange={(e) => setExpeditorSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Expeditors List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoadingExpeditors ? (
                      <div className="text-center py-8">
                        <LoadingSpinner size="sm" />
                        <p className="text-sm text-gray-500 mt-2">{t('loading_expeditors')}</p>
                      </div>
                    ) : filteredExpeditors.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>{t('no_expeditors_found')}</p>
                        {filters.filial && <p className="text-xs mt-2">{t('try_changing_filter')}</p>}
                      </div>
                    ) : (
                      filteredExpeditors.map((expeditor) => (
                        <Card
                          key={expeditor.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedExpeditor?.id === expeditor.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                          }`}
                          onClick={() => handleExpeditorSelect(expeditor)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={expeditor.photo || "/placeholder-user.jpg"} />
                                <AvatarFallback>
                                  {expeditor.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "EX"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{expeditor.name}</p>
                                <p className="text-sm text-gray-500">{expeditor.phone_number}</p>
                                <p className="text-xs text-gray-400">{expeditor.transport_number}</p>
                                {expeditor.filial && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    <strong>Filial:</strong> {expeditor.filial}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        <div className={`flex ${isMobile ? "flex-col" : "h-screen"}`}>
          {!isMobile && (
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-3 border-b border-gray-200">
                {/* Compact header with title and user */}
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('expeditor_tracker')}
                  </h1>
                  
                  {/* User Profile - compact */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <User className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">
                          {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5 text-sm font-medium border-b">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <DropdownMenuItem onClick={logout} className="text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Update button */}
                <div className="mb-3">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleUpdate} 
                    disabled={isUpdating} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        <span className="text-xs">{updateMessage}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
{t('update_data')}
                      </>
                    )}
                  </Button>
                  {lastUpdatedAt && !isUpdating && (
                    <p className="text-xs text-gray-500 text-center mt-1">
{t('last_update')}: {formatDateTime(lastUpdatedAt)}
                    </p>
                  )}
                  {isUpdating && (
                    <Progress value={updateProgress} className="h-1.5 mt-2" />
                  )}
                </div>

                {/* Date Range Filter */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('date_range')}</label>
                  <DatePickerWithRange
                    dateRange={filters.dateRange}
                    onDateRangeChange={(range) => handleFilterChange("dateRange", range || getCurrentMonthRange())}
                  />
                </div>

                {/* Advanced Filters Toggle */}
                <div className="mb-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </div>
                    {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                  {isFiltersOpen && (
                    <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                      {/* Filial Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Filial</label>
                        <Select
                          value={filters.filial || "all"}
                          onValueChange={(value) => handleFilterChange("filial", value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={t('all_filials')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_filials')}</SelectItem>
                            {filials.map((filial) => (
                              <SelectItem key={filial.id} value={String(filial.id)}>
                                {filial.filial_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Project Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
                        <Select
                          value={filters.project || "all"}
                          onValueChange={(value) => handleFilterChange("project", value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={t('all_projects')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_projects')}</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.project_name}>
                                {project.project_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sklad Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Warehouse</label>
                        <Select
                          value={filters.sklad || "all"}
                          onValueChange={(value) => handleFilterChange("sklad", value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={t('all_warehouses')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_warehouses')}</SelectItem>
                            {sklads.map((sklad) => (
                              <SelectItem key={sklad.id} value={sklad.sklad_name}>
                                {sklad.sklad_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* City Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
                        <Select
                          value={filters.city || "all"}
                          onValueChange={(value) => handleFilterChange("city", value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={t('all_cities')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_cities')}</SelectItem>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.city_name}>
                                {city.city_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                        <Select
                          value={filters.status || "all"}
                          onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={t('all_statuses')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_statuses')}</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  )}

                <Separator className="my-4" />

                {/* Expeditor Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  <Input
placeholder={t('search_expeditors')}
                    value={expeditorSearchQuery}
                    onChange={(e) => setExpeditorSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Expeditors List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingExpeditors ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="sm" />
                    <p className="text-sm text-gray-500 mt-2">{t('loading_expeditors')}</p>
                  </div>
                ) : filteredExpeditors.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>{t('no_expeditors_found')}</p>
                    {filters.filial && <p className="text-xs mt-2">{t('try_changing_filter')}</p>}
                  </div>
                ) : (
                  filteredExpeditors.map((expeditor) => (
                    <Card
                      key={expeditor.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedExpeditor?.id === expeditor.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => handleExpeditorSelect(expeditor)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={expeditor.photo || "/placeholder-user.jpg"} />
                            <AvatarFallback>
                              {expeditor.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "EX"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{expeditor.name}</p>
                            <p className="text-sm text-gray-500">{expeditor.phone_number}</p>
                            <p className="text-xs text-gray-400">{expeditor.transport_number}</p>
                            {expeditor.filial && (
                              <p className="text-xs text-gray-500 mt-1">
                                <strong>Filial:</strong> {expeditor.filial}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          <div className={`flex-1 ${isMobile ? "flex flex-col" : "flex"}`}>
            <div className={`${isMobile ? "h-96" : "flex-1"} relative`}>
              <MapComponent
                checks={checks}
                selectedExpeditor={selectedExpeditor}
                loading={isLoadingChecks}
                onCheckClick={handleCheckClick}
                focusLocation={focusLocation}
              />
            </div>

            <div className={`${isMobile ? "flex-1" : "w-96"} bg-white border-l border-gray-200 flex flex-col`}>
              <div className={`${isMobile ? "border-b" : "h-1/2 border-b"} border-gray-200`}>
                <StatisticsPanel 
                  statistics={statistics} 
                  onMonthChange={(month) => {
                    const now = new Date()
                    const year = now.getFullYear()
                    const startDate = new Date(year, month, 1)
                    const endDate = new Date(year, month + 1, 0, 23, 59, 59)
                    setFilters(prev => ({
                      ...prev,
                      dateRange: { from: startDate, to: endDate },
                    }))
                  }}
                />
              </div>

              <div className={`${isMobile ? "flex-1" : "h-1/2"} flex flex-col`}>
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
{t('checks')}
                    {selectedExpeditor && <Badge variant="outline">{checks.length} {t('checks')}</Badge>}
                  </h2>

                  {selectedExpeditor && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
placeholder={t('search_expeditors')}
                        value={checkSearchQuery}
                        onChange={(e) => setCheckSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {!selectedExpeditor ? (
                    <div className="text-center text-gray-500 mt-8">
                      <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>{t('select_expeditor_to_view_checks')}</p>
                    </div>
                  ) : isLoadingChecks ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size="sm" />
                      <p className="text-sm text-gray-500 mt-2">{t('loading_checks')}</p>
                    </div>
                  ) : checks.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>{t('no_checks_found')}</p>
                      <p className="text-xs mt-2">{t('try_adjusting_filters')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {checks.map((check) => (
                        <Card key={check.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Button
                                  variant="link"
                                  className="h-auto p-0 text-sm font-medium text-blue-600"
                                  onClick={() => handleCheckClick(check)}
                                >
                                  {check.check_id}
                                </Button>
                                <Badge variant="outline" className="text-xs">
                                  {new Date(check.check_date).toLocaleDateString()}
                                </Badge>
                              </div>

                              <div className="text-xs text-gray-600 space-y-1">
                                <p>
                                  <strong>Project:</strong> {check.project}
                                </p>
                                <p>
                                  <strong>City:</strong> {check.city}
                                </p>
                                <p>
                                  <strong>KKM:</strong> {check.kkm_number}
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-green-600">
                                  {formatCurrency(check.total_sum || 0)}
                                </span>
                                {check.check_lat && check.check_lon && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs bg-transparent"
                                    onClick={() => handleShowLocation(check)}
                                  >
                                    <MapPin className="h-3 w-3 mr-1" />
                                    Show
                                  </Button>
                                )}
                              </div>

                              <div className="text-xs text-gray-500 space-y-1">
                                {(check.nalichniy || 0) > 0 && (
                                  <div className="flex justify-between">
                                    <span>Cash:</span>
                                    <span>{formatCurrency(check.nalichniy || 0)}</span>
                                  </div>
                                )}
                                {(check.uzcard || 0) > 0 && (
                                  <div className="flex justify-between">
                                    <span>UzCard:</span>
                                    <span>{formatCurrency(check.uzcard || 0)}</span>
                                  </div>
                                )}
                                {(check.humo || 0) > 0 && (
                                  <div className="flex justify-between">
                                    <span>Humo:</span>
                                    <span>{formatCurrency(check.humo || 0)}</span>
                                  </div>
                                )}
                                {(check.click || 0) > 0 && (
                                  <div className="flex justify-between">
                                    <span>Click:</span>
                                    <span>{formatCurrency(check.click || 0)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CheckModal
          check={selectedCheck}
          isOpen={isCheckModalOpen}
          onClose={() => {
            setIsCheckModalOpen(false)
            setSelectedCheck(null)
          }}
          onShowLocation={handleShowLocation}
        />
        {/* Lightweight progress overlay */}
        {isUpdating && (
          <div className="fixed top-3 left-3 z-50 w-64 rounded-lg border bg-white shadow">
            <div className="px-3 pt-2 text-xs text-gray-600">{updateMessage || "Updating…"}</div>
            <div className="h-2 m-3 rounded bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${Math.max(5, updateProgress)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
