"use client"

import React, { memo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Filter } from "lucide-react"
import { useTranslation } from "../../lib/simple-i18n"
import type { Project, Sklad, City, Filial } from "@/lib/types"

interface FilterState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  project: string
  sklad: string
  city: string
  filial: string
  status: string
}

interface MemoizedFiltersProps {
  filters: FilterState
  onFilterChange: (key: keyof FilterState, value: any) => void
  onClearAllFilters: () => void
  activeFiltersCount: number
  projects: Project[]
  sklads: Sklad[]
  cities: City[]
  filials: Filial[]
}

function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: firstDay, to: lastDay }
}

const MemoizedFilters = memo<MemoizedFiltersProps>(({
  filters,
  onFilterChange,
  onClearAllFilters,
  activeFiltersCount,
  projects,
  sklads,
  cities,
  filials
}) => {
  const { t } = useTranslation()
  
  const handleDateRangeChange = useCallback((range: any) => {
    onFilterChange("dateRange", range || getCurrentMonthRange())
  }, [onFilterChange])
  
  const handleProjectChange = useCallback((value: string) => {
    onFilterChange("project", value === "all" ? "" : value)
  }, [onFilterChange])
  
  const handleSkladChange = useCallback((value: string) => {
    onFilterChange("sklad", value === "all" ? "" : value)
  }, [onFilterChange])
  
  const handleCityChange = useCallback((value: string) => {
    onFilterChange("city", value === "all" ? "" : value)
  }, [onFilterChange])
  
  const handleFilialChange = useCallback((value: string) => {
    onFilterChange("filial", value === "all" ? "" : value)
  }, [onFilterChange])
  
  const handleStatusChange = useCallback((value: string) => {
    onFilterChange("status", value === "all" ? "" : value)
  }, [onFilterChange])
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('advancedFilters')}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} {t('active')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Date Range */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('dateRange')}
            </label>
            <DatePickerWithRange
              dateRange={filters.dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>

          {/* Project Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('project')}
            </label>
            <Select
              value={filters.project || "all"}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('allProjects')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allProjects')}</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.project_name}>
                    {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('warehouse')}
            </label>
            <Select
              value={filters.sklad || "all"}
              onValueChange={handleSkladChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('allWarehouses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allWarehouses')}</SelectItem>
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('city')}
            </label>
            <Select
              value={filters.city || "all"}
              onValueChange={handleCityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('allCities')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCities')}</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.city_name}>
                    {city.city_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filial Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('filial')}
            </label>
            <Select
              value={filters.filial || "all"}
              onValueChange={handleFilialChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('allFilials')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allFilials')}</SelectItem>
                {filials.map((filial) => (
                  <SelectItem key={filial.id} value={String(filial.id)}>
                    {filial.filial_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('status')}
            </label>
            <Select
              value={filters.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="delivered">{t('delivered')}</SelectItem>
                <SelectItem value="pending">{t('awaitingDelivery')}</SelectItem>
                <SelectItem value="failed">{t('failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClearAllFilters}>
              {t('clearAllFilters')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

MemoizedFilters.displayName = "MemoizedFilters"

export default MemoizedFilters
