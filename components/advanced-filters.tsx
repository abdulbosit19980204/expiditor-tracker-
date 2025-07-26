"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import type { FilterOptions, Project, Sklad, City, Filial } from "@/lib/types"

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  projects?: Project[]
  sklads?: Sklad[]
  cities?: City[]
  filials?: Filial[] // Added filials prop
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  projects = [],
  sklads = [],
  cities = [],
  filials = [], // Added filials default value
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter((value) => {
    if (typeof value === "string") return value !== ""
    if (typeof value === "object" && value !== null) {
      return value.from !== undefined || value.to !== undefined
    }
    return false
  }).length

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: { from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), to: new Date() },
      project: "",
      sklad: "",
      city: "",
      filial: "", // Reset filial filter
      status: "",
      paymentMethod: "",
    })
  }

  return (
    <div className="space-y-3">
      {/* Date Range - Always Visible */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
        <DatePickerWithRange
          dateRange={filters.dateRange}
          onDateRangeChange={(range) =>
            onFiltersChange({ ...filters, dateRange: range || { from: undefined, to: undefined } })
          }
        />
      </div>

      {/* Advanced Filters Toggle */}
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="w-full justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Collapsible Filters */}
      {isOpen && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          {/* Project Filter */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
            <Select
              value={filters.project || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, project: value === "all" ? "" : value })}
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
              value={filters.sklad || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, sklad: value === "all" ? "" : value })}
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
          {/* Filial Filter */}
          <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Filial</label>
          <Select
            value={filters.filial || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, filial: value === "all" ? "" : value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All Filial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Filial</SelectItem>
              {filials.map((filial) => (
                <SelectItem key={filial.id} value={String(filial.id)}>
                  {filial.filial_name}
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
              onValueChange={(value) => onFiltersChange({ ...filters, city: value === "all" ? "" : value })}
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
              value={filters.status || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === "all" ? "" : value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Method</label>
            <Select
              value={filters.paymentMethod || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, paymentMethod: value === "all" ? "" : value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="nalichniy">Cash</SelectItem>
                <SelectItem value="uzcard">UzCard</SelectItem>
                <SelectItem value="humo">Humo</SelectItem>
                <SelectItem value="click">Click</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
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
  )
}
