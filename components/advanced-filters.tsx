"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Building, MapPin, Warehouse, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
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
                  {sklad.sklad_name}
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
                  {city.city_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Status</span>
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
  )
}
