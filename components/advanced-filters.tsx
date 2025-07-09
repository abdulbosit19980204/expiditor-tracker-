"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Building, MapPin, Warehouse, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DatePickerWithRange } from "./date-range-picker"
import { LoadingSpinner } from "./loading-spinner"
import type { FilterOptions, Project, Sklad, City } from "../lib/types"
import { getProjects, getSklads, getCities } from "../lib/api"

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

export function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [projectsData, skladsData, citiesData] = await Promise.all([getProjects(), getSklads(), getCities()])
        setProjects(projectsData)
        setSklads(skladsData)
        setCities(citiesData)
      } catch (error) {
        console.error("Error loading filter data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFilterData()
  }, [])

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.project) count++
    if (filters.sklad) count++
    if (filters.city) count++
    if (filters.status && filters.status !== "all") count++
    if (filters.paymentMethod && filters.paymentMethod !== "all") count++
    return count
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: filters.dateRange, // Keep date range
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Always visible Date Range */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">Date Range</span>
        </div>
        <DatePickerWithRange
          dateRange={filters.dateRange}
          onDateRangeChange={(dateRange) => handleFilterChange("dateRange", dateRange)}
        />
      </div>

      {/* Collapsible Filters */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 w-full justify-between bg-transparent">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Advanced Filters</span>
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-4 mt-3">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Clear All Filters Button */}
              {getActiveFiltersCount() > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

              {/* Project Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Project</span>
                </div>
                <Select
                  value={filters.project || "all"}
                  onValueChange={(value) => handleFilterChange("project", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
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
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Warehouse</span>
                </div>
                <Select
                  value={filters.sklad || "all"}
                  onValueChange={(value) => handleFilterChange("sklad", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {sklads.map((sklad) => (
                      <SelectItem key={sklad.id} value={sklad.sklad_name}>
                        {sklad.sklad_name} ({sklad.sklad_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">City</span>
                </div>
                <Select
                  value={filters.city || "all"}
                  onValueChange={(value) => handleFilterChange("city", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.city_name}>
                        {city.city_name} ({city.city_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Delivery Status</span>
                </div>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Payment Method</span>
                </div>
                <Select
                  value={filters.paymentMethod || "all"}
                  onValueChange={(value) => handleFilterChange("paymentMethod", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Payment Methods" />
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
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
