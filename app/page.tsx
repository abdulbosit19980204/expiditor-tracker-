"use client"

import { useState, useEffect, useMemo } from "react"
import { CalendarDays, MapPin, Users, Clock, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { MapComponent } from "@/components/map-component"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getExpeditors, getClients, getVisitedLocations } from "@/lib/api"
import type { Expeditor, Client, VisitedLocation, DateRange } from "@/lib/types"

export default function ExpeditorTracker() {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  })
  const [expeditors, setExpeditors] = useState<Expeditor[]>([])
  const [selectedExpeditor, setSelectedExpeditor] = useState<Expeditor | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [visitedLocations, setVisitedLocations] = useState<VisitedLocation[]>([])
  const [expeditorSearchQuery, setExpeditorSearchQuery] = useState("")
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [loading, setLoading] = useState({
    expeditors: true,
    clients: false,
    locations: false,
  })

  // Load expeditors on component mount
  useEffect(() => {
    loadExpeditors()
  }, [])

  // Load clients and locations when expeditor or date range changes
  useEffect(() => {
    if (selectedExpeditor) {
      loadClientsAndLocations()
    }
  }, [selectedExpeditor, selectedDateRange])

  // Filter expeditors based on search query
  const filteredExpeditors = useMemo(() => {
    if (!expeditorSearchQuery.trim()) return expeditors

    const query = expeditorSearchQuery.toLowerCase()
    return expeditors.filter(
      (expeditor) => expeditor.name.toLowerCase().includes(query) || expeditor.phone.toLowerCase().includes(query),
    )
  }, [expeditors, expeditorSearchQuery])

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients

    const query = clientSearchQuery.toLowerCase()
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.address.toLowerCase().includes(query) ||
        client.status.toLowerCase().includes(query),
    )
  }, [clients, clientSearchQuery])

  const loadExpeditors = async () => {
    setLoading((prev) => ({ ...prev, expeditors: true }))
    try {
      const data = await getExpeditors()
      setExpeditors(data)
      if (data.length > 0) {
        setSelectedExpeditor(data[0])
      }
    } catch (error) {
      console.error("Failed to load expeditors:", error)
    } finally {
      setLoading((prev) => ({ ...prev, expeditors: false }))
    }
  }

  const loadClientsAndLocations = async () => {
    if (!selectedExpeditor) return

    setLoading((prev) => ({ ...prev, clients: true, locations: true }))

    try {
      const [clientsData, locationsData] = await Promise.all([
        getClients(selectedExpeditor.id, selectedDateRange),
        getVisitedLocations(selectedExpeditor.id, selectedDateRange),
      ])

      setClients(clientsData)
      setVisitedLocations(locationsData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading((prev) => ({ ...prev, clients: false, locations: false }))
    }
  }

  const handleExpeditorSelect = (expeditor: Expeditor) => {
    setSelectedExpeditor(expeditor)
    // Clear client search when switching expeditors
    setClientSearchQuery("")
  }

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    if (dateRange) {
      setSelectedDateRange(dateRange)
    }
  }

  const clearExpeditorSearch = () => {
    setExpeditorSearchQuery("")
  }

  const clearClientSearch = () => {
    setClientSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Expeditor Movement Tracker</h1>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Date Filter */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Date Range</h3>
            </div>
            <DatePickerWithRange dateRange={selectedDateRange} onDateRangeChange={handleDateRangeChange} />
          </div>

          {/* Expeditors List */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Expeditors</h3>
              <Badge variant="outline" className="text-xs">
                {filteredExpeditors.length}/{expeditors.length}
              </Badge>
            </div>

            {/* Expeditor Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search expeditors..."
                value={expeditorSearchQuery}
                onChange={(e) => setExpeditorSearchQuery(e.target.value)}
                className="pl-10 pr-8"
              />
              {expeditorSearchQuery && (
                <button
                  onClick={clearExpeditorSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            {loading.expeditors ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredExpeditors.length > 0 ? (
                  filteredExpeditors.map((expeditor) => (
                    <Card
                      key={expeditor.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedExpeditor?.id === expeditor.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => handleExpeditorSelect(expeditor)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={expeditor.avatar || "/placeholder.svg"} alt={expeditor.name} />
                            <AvatarFallback>
                              {expeditor.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{expeditor.name}</p>
                            <p className="text-sm text-gray-500">{expeditor.phone}</p>
                          </div>
                          <Badge variant={expeditor.status === "active" ? "default" : "secondary"}>
                            {expeditor.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No expeditors found</p>
                    <p className="text-gray-400 text-xs">Try adjusting your search</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clients List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Visited Clients</h3>
              {selectedExpeditor && (
                <Badge variant="outline" className="text-xs">
                  {filteredClients.length}/{clients.length}
                </Badge>
              )}
            </div>

            {selectedExpeditor ? (
              <>
                {/* Client Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="pl-10 pr-8"
                  />
                  {clientSearchQuery && (
                    <button
                      onClick={clearClientSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>

                {loading.clients ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <Card key={client.id} className="hover:bg-gray-50">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{client.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {client.visitTime}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{client.address}</p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={client.status === "delivered" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {client.status}
                              </Badge>
                              {client.checkoutTime && (
                                <span className="text-xs text-gray-500">Out: {client.checkoutTime}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : clientSearchQuery ? (
                      <div className="text-center py-4">
                        <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No clients found</p>
                        <p className="text-gray-400 text-xs">Try adjusting your search</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No clients visited in selected date range</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">Select an expeditor to view clients</p>
            )}
          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <MapComponent
            locations={visitedLocations}
            loading={loading.locations}
            selectedExpeditor={selectedExpeditor}
          />
        </div>
      </div>
    </div>
  )
}
