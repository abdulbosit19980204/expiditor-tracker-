"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react"
import { DateRangePicker } from "./date-range-picker"

interface FilterState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  project: string
  sklad: string
  city: string
  expeditor: string
  status: string
  paymentMethod: string
  searchQuery: string
}

interface AdvancedFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  projects: Array<{ id: string; name: string }>
  sklads: Array<{ id: string; name: string }>
  cities: Array<{ id: string; name: string }>
  expeditors: Array<{ id: string; name: string }>
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  projects,
  sklads,
  cities,
  expeditors,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: { from: undefined, to: undefined },
      project: "",
      sklad: "",
      city: "",
      expeditor: "",
      status: "",
      paymentMethod: "",
      searchQuery: "",
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.project) count++
    if (filters.sklad) count++
    if (filters.city) count++
    if (filters.expeditor) count++
    if (filters.status) count++
    if (filters.paymentMethod) count++
    if (filters.searchQuery) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Filterlar</CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} faol
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Range - Always visible */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sana oralig'i</label>
          <DateRangePicker
            date={filters.dateRange}
            onDateChange={(dateRange) => updateFilter("dateRange", dateRange)}
          />
        </div>

        {/* Search - Always visible */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Qidiruv</label>
          <Input
            placeholder="Check ID, mijoz nomi yoki manzil..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="w-full"
          />
        </div>

        {/* Advanced Filters - Collapsible */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Loyiha</label>
                <Select value={filters.project} onValueChange={(value) => updateFilter("project", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Loyihani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sklad Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sklad</label>
                <Select value={filters.sklad} onValueChange={(value) => updateFilter("sklad", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Skladni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {sklads.map((sklad) => (
                      <SelectItem key={sklad.id} value={sklad.id}>
                        {sklad.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Shahar</label>
                <Select value={filters.city} onValueChange={(value) => updateFilter("city", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Shaharni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expeditor Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Expeditor</label>
                <Select value={filters.expeditor} onValueChange={(value) => updateFilter("expeditor", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Expeditorni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {expeditors.map((expeditor) => (
                      <SelectItem key={expeditor.id} value={expeditor.id}>
                        {expeditor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statusni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="delivered">Yetkazilgan</SelectItem>
                    <SelectItem value="pending">Kutilmoqda</SelectItem>
                    <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To'lov usuli</label>
                <Select value={filters.paymentMethod} onValueChange={(value) => updateFilter("paymentMethod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="To'lov usulini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="nalichniy">Naqd</SelectItem>
                    <SelectItem value="uzcard">UzCard</SelectItem>
                    <SelectItem value="humo">Humo</SelectItem>
                    <SelectItem value="click">Click</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <X className="h-4 w-4" />
                  Barcha filterlarni tozalash
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
