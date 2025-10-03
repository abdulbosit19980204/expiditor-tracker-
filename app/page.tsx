"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Phone, Package, Building, DollarSign, Users, CheckCircle } from "lucide-react"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { CheckModal } from "@/components/check-modal"
import { StatisticsPanel } from "@/components/statistics-panel"
import { MapComponent } from "@/components/map-component"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  getExpeditors,
  getChecks,
  getFilials,
  getStatistics,
  type Expeditor,
  type Check,
  type Filial,
  type Statistics,
  type FilterParams,
} from "@/lib/api"

export default function ExpeditorTracker() {
  // State management
  const [expeditors, setExpeditors] = useState<Expeditor[]>([])
  const [filteredExpeditors, setFilteredExpeditors] = useState<Expeditor[]>([])
  const [checks, setChecks] = useState<Check[]>([])
  const [filials, setFilials] = useState<Filial[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    total_checks: 0,
    total_amount: 0,
    status_distribution: [],
    city_distribution: [],
    project_distribution: [],
  })

  // Filter states
  const [selectedExpeditor, setSelectedExpeditor] = useState<Expeditor | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilial, setSelectedFilial] = useState<string>("all") // Updated default value to 'all'
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  // UI states
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingChecks, setIsLoadingChecks] = useState(false)
  const isMobile = useIsMobile()

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        const [expeditorsData, filialsData] = await Promise.all([getExpeditors(), getFilials()])

        setExpeditors(expeditorsData)
        setFilials(filialsData)
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Filter expeditors based on search and filial
  useEffect(() => {
    let filtered = expeditors

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (expeditor) =>
          expeditor.name.toLowerCase().includes(searchTerm.toLowerCase()) || expeditor.phone.includes(searchTerm),
      )
    }

    // Filter by filial
    if (selectedFilial !== "all") {
      filtered = filtered.filter((expeditor) => expeditor.filial?.toString() === selectedFilial)
    }

    setFilteredExpeditors(filtered)
  }, [expeditors, searchTerm, selectedFilial])

  // Load checks and statistics when filters change
  useEffect(() => {
    const loadChecksAndStats = async () => {
      if (!selectedExpeditor) {
        setChecks([])
        setStatistics({
          total_checks: 0,
          total_amount: 0,
          status_distribution: [],
          city_distribution: [],
          project_distribution: [],
        })
        return
      }

      setIsLoadingChecks(true)
      try {
        const filters: FilterParams = {
          expeditor_id: selectedExpeditor.id,
        }

        // Add date range filters
        if (dateRange.from) {
          filters.date_from = dateRange.from.toISOString().split("T")[0]
        }
        if (dateRange.to) {
          filters.date_to = dateRange.to.toISOString().split("T")[0]
        }

        const [checksData, statsData] = await Promise.all([getChecks(filters), getStatistics(filters)])

        setChecks(checksData)
        setStatistics(statsData)
      } catch (error) {
        console.error("Error loading checks and statistics:", error)
        setChecks([])
        setStatistics({
          total_checks: 0,
          total_amount: 0,
          status_distribution: [],
          city_distribution: [],
          project_distribution: [],
        })
      } finally {
        setIsLoadingChecks(false)
      }
    }

    loadChecksAndStats()
  }, [selectedExpeditor, dateRange])

  const handleExpeditorSelect = (expeditor: Expeditor) => {
    setSelectedExpeditor(expeditor)
  }

  const handleCheckClick = (check: Check) => {
    setSelectedCheck(check)
  }

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    setDateRange(range || { from: undefined, to: undefined })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedFilial("all") // Updated default value to 'all'
    setDateRange({ from: undefined, to: undefined })
    setSelectedExpeditor(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Expeditor Tracker</h1>
          <p className="text-gray-600">Track delivery couriers and their visited locations</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Expeditors</label>
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Filial</label>
                <Select value={selectedFilial} onValueChange={setSelectedFilial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Filials</SelectItem>
                    {filials.map((filial) => (
                      <SelectItem key={filial.id} value={filial.id.toString()}>
                        {filial.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <DatePickerWithRange dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full bg-transparent">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expeditors List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Expeditors ({filteredExpeditors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredExpeditors.map((expeditor) => (
                    <div
                      key={expeditor.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedExpeditor?.id === expeditor.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleExpeditorSelect(expeditor)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={expeditor.photo || "/placeholder.svg"} alt={expeditor.name} />
                          <AvatarFallback>
                            {expeditor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{expeditor.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            {expeditor.phone}
                          </div>
                          {expeditor.filial_name && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Building className="h-3 w-3" />
                              {expeditor.filial_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedExpeditor ? (
              <>
                {/* Statistics */}
                <StatisticsPanel statistics={statistics} isLoading={isLoadingChecks} />

                {/* Map */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Locations Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 md:h-80 lg:h-96">
                      <MapComponent checks={checks} />
                    </div>
                  </CardContent>
                </Card>

                {/* Checks List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Recent Checks ({checks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingChecks ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : checks.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {checks.map((check) => (
                          <div
                            key={check.id}
                            className="p-4 border rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
                            onClick={() => handleCheckClick(check)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{check.holat}</Badge>
                                  <span className="text-sm text-gray-500">
                                    {check.sana} {check.vaqt}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Package className="h-4 w-4 text-gray-400" />
                                    {check.loyiha}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Building className="h-4 w-4 text-gray-400" />
                                    {check.sklad}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    {check.shahar}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-lg font-semibold">
                                  <DollarSign className="h-4 w-4" />
                                  {check.summa.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No checks found for the selected expeditor and date range.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Expeditor</h3>
                  <p className="text-gray-500">Choose an expeditor from the list to view their checks and locations.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Check Details Modal */}
      {selectedCheck && <CheckModal check={selectedCheck} onClose={() => setSelectedCheck(null)} />}
    </div>
  )
}
