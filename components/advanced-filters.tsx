"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { FilterOptions, Project, Sklad, City, Expeditor } from "../lib/types"
import { getProjects, getSklads, getCities, getExpeditors } from "../lib/api"

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

export function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [expeditors, setExpeditors] = useState<Expeditor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [projectsData, skladsData, citiesData, expeditorsData] = await Promise.all([
          getProjects(),
          getSklads(),
          getCities(),
          getExpeditors(),
        ])
        setProjects(projectsData)
        setSklads(skladsData)
        setCities(citiesData)
        setExpeditors(expeditorsData)
      } catch (error) {
        console.error("Error loading filter data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFilterData()
  }, [])

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilter = (key: keyof FilterOptions) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: filters.dateRange, // Keep date range
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.project) count++
    if (filters.sklad) count++
    if (filters.city) count++
    if (filters.expeditor) count++
    if (filters.status && filters.status !== "all") count++
    if (filters.paymentMethod && filters.paymentMethod !== "all") count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

        {getActiveFiltersCount() > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.project && (
            <Badge variant="outline" className="flex items-center gap-1">
              Project: {filters.project}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("project")} />
            </Badge>
          )}
          {filters.sklad && (
            <Badge variant="outline" className="flex items-center gap-1">
              Sklad: {filters.sklad}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("sklad")} />
            </Badge>
          )}
          {filters.city && (
            <Badge variant="outline" className="flex items-center gap-1">
              City: {filters.city}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("city")} />
            </Badge>
          )}
          {filters.expeditor && (
            <Badge variant="outline" className="flex items-center gap-1">
              Expeditor: {filters.expeditor}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("expeditor")} />
            </Badge>
          )}
          {filters.status && filters.status !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              Status: {filters.status}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("status")} />
            </Badge>
          )}
          {filters.paymentMethod && filters.paymentMethod !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              Payment: {filters.paymentMethod}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("paymentMethod")} />
            </Badge>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "MMM dd")} - {format(filters.dateRange.to, "MMM dd")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "MMM dd, y")
                      )
                    ) : (
                      <span>Pick date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) => updateFilter("dateRange", range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Project Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select
                value={filters.project || "all"}
                onValueChange={(value) => updateFilter("project", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
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
              <label className="text-sm font-medium mb-2 block">Sklad</label>
              <Select
                value={filters.sklad || "all"}
                onValueChange={(value) => updateFilter("sklad", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sklad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sklads</SelectItem>
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
              <label className="text-sm font-medium mb-2 block">City</label>
              <Select
                value={filters.city || "all"}
                onValueChange={(value) => updateFilter("city", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
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

            {/* Expeditor Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Expeditor</label>
              <Select
                value={filters.expeditor || "all"}
                onValueChange={(value) => updateFilter("expeditor", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expeditor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expeditors</SelectItem>
                  {expeditors.map((expeditor) => (
                    <SelectItem key={expeditor.id} value={expeditor.name}>
                      {expeditor.name} ({expeditor.transport_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Delivery Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => updateFilter("status", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <Select
                value={filters.paymentMethod || "all"}
                onValueChange={(value) => updateFilter("paymentMethod", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  <SelectItem value="nalichniy">Nalichniy</SelectItem>
                  <SelectItem value="uzcard">UzCard</SelectItem>
                  <SelectItem value="humo">Humo</SelectItem>
                  <SelectItem value="click">Click</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
