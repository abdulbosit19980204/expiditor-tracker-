"use client"

import { useState, useEffect } from "react"
import { Search, Users, MapPin, Receipt } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/loading-spinner"
import { MapComponent } from "@/components/map-component"
import { AdvancedFilters } from "@/components/advanced-filters"
import { StatisticsPanel } from "@/components/statistics-panel"
import { CheckModal } from "@/components/check-modal"
import type { Expeditor, Client, VisitedLocation, FilterOptions, Check } from "@/lib/types"
import { getExpeditors, getClients, getVisitedLocations, getExpeditorTodayChecksCount } from "@/lib/api"

export default function ExpeditorTracker() {
  const [expeditors, setExpeditors] = useState<Expeditor[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [locations, setLocations] = useState<VisitedLocation[]>([])
  const [selectedExpeditor, setSelectedExpeditor] = useState<Expeditor | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [expeditorChecksCounts, setExpeditorChecksCounts] = useState<Record<string, number>>({})
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null)
  const [checkModalOpen, setCheckModalOpen] = useState(false)

  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      from: new Date(new Date().setDate(new Date().getDate() - 7)),
      to: new Date(),
    },
  })

  // Load expeditors on mount
  useEffect(() => {
    const loadExpeditors = async () => {
      try {
        const data = await getExpeditors()
        setExpeditors(data)

        // Load today's checks count for each expeditor
        const counts: Record<string, number> = {}
        for (const expeditor of data) {
          counts[expeditor.id] = await getExpeditorTodayChecksCount(expeditor.id)
        }
        setExpeditorChecksCounts(counts)
      } catch (error) {
        console.error("Error loading expeditors:", error)
      } finally {
        setLoading(false)
      }
    }

    loadExpeditors()
  }, [])

  // Load clients and locations when expeditor or filters change
  useEffect(() => {
    if (!selectedExpeditor) {
      setClients([])
      setLocations([])
      return
    }

    const loadData = async () => {
      setClientsLoading(true)
      setLocationsLoading(true)

      try {
        const [clientsData, locationsData] = await Promise.all([
          getClients(selectedExpeditor.id, filters),
          getVisitedLocations(selectedExpeditor.id, filters),
        ])
        setClients(clientsData)
        setLocations(locationsData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setClientsLoading(false)
        setLocationsLoading(false)
      }
    }

    loadData()
  }, [selectedExpeditor, filters])

  // Filter expeditors based on search
  const filteredExpeditors = expeditors.filter(
    (expeditor) =>
      expeditor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expeditor.phone.includes(searchTerm) ||
      expeditor.transport_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Filter clients based on search
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.address.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.check?.check_id.toLowerCase().includes(clientSearchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleCheckClick = (check: Check) => {
    setSelectedCheck(check)
    setCheckModalOpen(true)
  }

  const handleShowCheckLocation = (check: Check) => {
    if (check.check_detail?.check_lat && check.check_detail?.check_lon) {
      // This would focus the map on the check location
      console.log("Focus map on check location:", {
        lat: check.check_detail.check_lat,
        lng: check.check_detail.check_lon,
        checkId: check.check_id,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Sidebar - Expeditors */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Expeditor Tracker
            </h1>

            {/* Advanced Filters */}
            <AdvancedFilters filters={filters} onFiltersChange={setFilters} />

            <Separator className="my-4" />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search expeditors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Expeditors List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredExpeditors.map((expeditor) => (
              <Card
                key={expeditor.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedExpeditor?.id === expeditor.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => setSelectedExpeditor(expeditor)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={expeditor.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {expeditor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{expeditor.name}</p>
                        <Badge variant={expeditor.status === "active" ? "default" : "secondary"}>
                          {expeditor.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{expeditor.phone}</p>
                      <p className="text-xs text-gray-400">{expeditor.transport_number}</p>

                      {/* Today's checks count */}
                      <div className="flex items-center gap-2 mt-2">
                        <Receipt className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600 font-medium">
                          {expeditorChecksCounts[expeditor.id] || 0} checks today
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Center - Map */}
        <div className="flex-1 relative">
          <MapComponent
            locations={locations}
            loading={locationsLoading}
            selectedExpeditor={selectedExpeditor}
            onLocationClick={handleShowCheckLocation}
          />
        </div>

        {/* Right Sidebar - Statistics and Clients */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Statistics Panel */}
          <div className="h-1/2 border-b border-gray-200">
            <StatisticsPanel filters={filters} />
          </div>

          {/* Clients List */}
          <div className="h-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Visited Clients
                {selectedExpeditor && <Badge variant="outline">{clients.length}</Badge>}
              </h2>

              {selectedExpeditor && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!selectedExpeditor ? (
                <div className="text-center text-gray-500 mt-8">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select an expeditor to view clients</p>
                </div>
              ) : clientsLoading ? (
                <div className="flex justify-center mt-8">
                  <LoadingSpinner />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No clients found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClients.map((client) => (
                    <Card key={client.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm">{client.name}</h3>
                            <Badge variant={client.status === "delivered" ? "default" : "destructive"}>
                              {client.status}
                            </Badge>
                          </div>

                          <p className="text-xs text-gray-600">{client.address}</p>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Visit: {client.visitTime}</span>
                            {client.checkoutTime && <span>Left: {client.checkoutTime}</span>}
                          </div>

                          {/* Check Information */}
                          {client.check && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Check ID:</span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs font-mono text-blue-600"
                                  onClick={() => handleCheckClick(client.check!)}
                                >
                                  {client.check.check_id}
                                </Button>
                              </div>

                              {client.check.check_detail && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="font-medium">Total:</span>
                                    <span className="font-bold text-green-600">
                                      {formatCurrency(client.check.check_detail.total_sum || 0)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span>Check Date:</span>
                                    <span>
                                      {new Date(client.check.check_detail.check_date).toLocaleString("uz-UZ", {
                                        month: "2-digit",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>

                                  {/* Payment Methods */}
                                  <div className="space-y-1 mt-2">
                                    {client.check.check_detail.nalichniy > 0 && (
                                      <div className="flex justify-between">
                                        <span>Cash:</span>
                                        <span>{formatCurrency(client.check.check_detail.nalichniy)}</span>
                                      </div>
                                    )}
                                    {client.check.check_detail.uzcard > 0 && (
                                      <div className="flex justify-between">
                                        <span>UzCard:</span>
                                        <span>{formatCurrency(client.check.check_detail.uzcard)}</span>
                                      </div>
                                    )}
                                    {client.check.check_detail.humo > 0 && (
                                      <div className="flex justify-between">
                                        <span>Humo:</span>
                                        <span>{formatCurrency(client.check.check_detail.humo)}</span>
                                      </div>
                                    )}
                                    {client.check.check_detail.click > 0 && (
                                      <div className="flex justify-between">
                                        <span>Click:</span>
                                        <span>{formatCurrency(client.check.check_detail.click)}</span>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}

                              <div className="flex justify-between">
                                <span>Project:</span>
                                <span>{client.check.project}</span>
                              </div>

                              <div className="flex justify-between">
                                <span>KKM:</span>
                                <span className="font-mono">{client.check.kkm_number}</span>
                              </div>

                              {/* Show location button */}
                              {client.check.check_detail?.check_lat && client.check.check_detail?.check_lon && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2 h-6 text-xs bg-transparent"
                                  onClick={() => handleShowCheckLocation(client.check!)}
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Show on Map
                                </Button>
                              )}
                            </div>
                          )}
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

      {/* Check Modal */}
      <CheckModal
        check={selectedCheck}
        isOpen={checkModalOpen}
        onClose={() => {
          setCheckModalOpen(false)
          setSelectedCheck(null)
        }}
      />
    </div>
  )
}
