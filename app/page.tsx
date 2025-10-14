"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Users, MapPin, Filter, ChevronDown, ChevronUp, X, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LoadingSpinner } from "@/components/loading-spinner"
import { MapComponent } from "@/components/map-component"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { CheckModal } from "@/components/check-modal"
import { StatisticsPanel } from "@/components/statistics-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Check, Expeditor, Project, Sklad, City, Statistics, Filial } from "@/lib/types"
import { api } from "@/lib/api"

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
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingChecks, setIsLoadingChecks] = useState(false)
  const [isLoadingExpeditors, setIsLoadingExpeditors] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expeditorSearchQuery, setExpeditorSearchQuery] = useState("")
  const [checkSearchQuery, setCheckSearchQuery] = useState("")

  // Initialize filters with current month as default
  const [filters, setFilters] = useState<FilterState>(() => ({
    dateRange: getCurrentMonthRange(),
    project: "",
    sklad: "",
    city: "",
    filial: "",
    status: "",
  }))

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

  // Load expeditors when filial filter changes
  useEffect(() => {
    const loadExpeditors = async () => {
      setIsLoadingExpeditors(true)
      try {
        const expeditorsData = await api.getExpeditors(filters.filial)
        setExpeditors(expeditorsData)

        // Auto-select first expeditor if available
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

  // Filter expeditors by search query (client-side only for search)
  const filteredExpeditors = useMemo(() => {
    if (!expeditorSearchQuery) return expeditors

    const searchLower = expeditorSearchQuery.toLowerCase()
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
    if (filters.dateRange.from || filters.dateRange.to) count++
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
      setFocusLocation({ lat: check.check_lat, lng: check.check_lon })
    }
  }, [])

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

  // Sidebar content component (memoized to prevent re-renders)
  const SidebarContent = useMemo(
    () => (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Expeditor Tracker
          </h1>

          {/* Date Range Filter */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
            <DatePickerWithRange
              dateRange={filters.dateRange}
              onDateRangeChange={(range) =>
                setFilters((prev) => ({ ...prev, dateRange: range || getCurrentMonthRange() }))
              }
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
                Advanced Filters
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
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Filial</label>
                  <Select
                    value={filters.filial}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, filial: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Filials" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Filials</SelectItem>
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
                    value={filters.project}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, project: value === "all" ? "" : value }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
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
                    value={filters.sklad}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, sklad: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
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
                    value={filters.city}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, city: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
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
                    value={filters.status}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
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
          </div>

          <Separator className="my-4" />

          {/* Expeditor Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <Input
              placeholder="Search expeditors..."
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
              <p className="text-sm text-gray-500 mt-2">Loading expeditors...</p>
            </div>
          ) : filteredExpeditors.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No expeditors found</p>
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
    ),
    [
      filters,
      activeFiltersCount,
      isFiltersOpen,
      expeditorSearchQuery,
      isLoadingExpeditors,
      filteredExpeditors,
      selectedExpeditor,
      filials,
      projects,
      sklads,
      cities,
      handleExpeditorSelect,
      clearAllFilters,
    ],
  )

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Expeditor Tracker
          </h1>
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              {SidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      )}

      <div className={`flex ${isMobile ? "flex-col" : "h-screen"}`}>
        {!isMobile && <div className="w-80 bg-white border-r border-gray-200 flex flex-col">{SidebarContent}</div>}

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
              <StatisticsPanel statistics={statistics} />
            </div>

            <div className={`${isMobile ? "flex-1" : "h-1/2"} flex flex-col`}>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Checks
                  {selectedExpeditor && <Badge variant="outline">{checks.length}</Badge>}
                </h2>

                {selectedExpeditor && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search checks..."
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
                    <p>Select an expeditor to view checks</p>
                  </div>
                ) : isLoadingChecks ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="sm" />
                    <p className="text-sm text-gray-500 mt-2">Loading checks...</p>
                  </div>
                ) : checks.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>No checks found</p>
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
    </div>
  )
}
