"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { DatePickerWithRange } from "@/components/date-range-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Filter,
  Plus,
  X,
  Save,
  Trash2,
  Calendar as CalendarIcon,
  Settings,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Download,
  Upload
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Project, Sklad, City, Filial } from "@/lib/types"
import { useUserPreferences } from "@/hooks/use-user-preferences"

export interface FilterCondition {
  id: string
  field: string
  operator: "equals" | "contains" | "not_equals" | "greater_than" | "less_than" | "between" | "in" | "not_in"
  value: string | string[] | { from: Date; to: Date }
  logicalOperator?: "AND" | "OR"
}

export interface SavedFilter {
  id: string
  name: string
  conditions: FilterCondition[]
  createdAt: Date
}

interface AdvancedFilterBuilderProps {
  projects: Project[]
  sklads: Sklad[]
  cities: City[]
  filials: Filial[]
  onFiltersChange: (conditions: FilterCondition[]) => void
  onSaveFilter?: (name: string, conditions: FilterCondition[]) => void
  className?: string
}

const FIELD_OPTIONS = [
  { value: "ekispiditor", label: "Expeditor", type: "string" },
  { value: "project", label: "Project", type: "string" },
  { value: "sklad", label: "Warehouse", type: "string" },
  { value: "city", label: "City", type: "string" },
  { value: "filial", label: "Filial", type: "string" },
  { value: "status", label: "Status", type: "select", options: ["delivered", "pending", "failed"] },
  { value: "total_sum", label: "Total Sum", type: "number" },
  { value: "yetkazilgan_vaqti", label: "Delivery Date", type: "date" },
  { value: "check_date", label: "Check Date", type: "date" },
  { value: "transport_number", label: "Transport Number", type: "string" },
  { value: "kkm_number", label: "KKM Number", type: "string" },
  { value: "client_name", label: "Client Name", type: "string" },
]

const OPERATOR_OPTIONS = {
  string: [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "not_equals", label: "Not Equals" },
    { value: "in", label: "In List" },
    { value: "not_in", label: "Not In List" },
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "between", label: "Between" },
  ],
  date: [
    { value: "equals", label: "Equals" },
    { value: "greater_than", label: "After" },
    { value: "less_than", label: "Before" },
    { value: "between", label: "Between" },
  ],
  select: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "in", label: "In List" },
    { value: "not_in", label: "Not In List" },
  ]
}

export function AdvancedFilterBuilder({
  projects,
  sklads,
  cities,
  filials,
  onFiltersChange,
  onSaveFilter,
  className
}: AdvancedFilterBuilderProps) {
  const { t } = useTranslation()
  const { preferences, addSavedFilter, removeSavedFilter, updatePreferences } = useUserPreferences()
  
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState("")

  // Initialize with saved filters from preferences
  useEffect(() => {
    if (preferences.savedFilters.length > 0) {
      // Convert saved filters to conditions format
      const savedConditions = preferences.savedFilters.flatMap(savedFilter => 
        savedFilter.filters ? [] : [] // We'll handle this conversion properly
      )
    }
  }, [preferences.savedFilters])

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(conditions)
  }, [conditions, onFiltersChange])

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: "ekispiditor",
      operator: "contains",
      value: "",
      logicalOperator: conditions.length > 0 ? "AND" : undefined
    }
    setConditions([...conditions, newCondition])
  }

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    ))
  }

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(condition => condition.id !== id))
  }

  const clearAllConditions = () => {
    setConditions([])
  }

  const getFieldType = (field: string) => {
    return FIELD_OPTIONS.find(f => f.value === field)?.type || "string"
  }

  const getFieldOptions = (field: string) => {
    return FIELD_OPTIONS.find(f => f.value === field)?.options || []
  }

  const getOperatorOptions = (field: string) => {
    const fieldType = getFieldType(field)
    return OPERATOR_OPTIONS[fieldType as keyof typeof OPERATOR_OPTIONS] || OPERATOR_OPTIONS.string
  }

  const renderValueInput = (condition: FilterCondition) => {
    const fieldType = getFieldType(condition.field)
    const fieldOptions = getFieldOptions(condition.field)

    switch (fieldType) {
      case "select":
        return (
          <Select
            value={condition.value as string}
            onValueChange={(value) => updateCondition(condition.id, { value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {fieldOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "date":
        if (condition.operator === "between") {
          return (
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {condition.value && typeof condition.value === "object" && "from" in condition.value
                      ? `${format(condition.value.from, "MMM dd")} - ${format(condition.value.to, "MMM dd")}`
                      : "Select date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={condition.value && typeof condition.value === "object" && "from" in condition.value ? condition.value : undefined}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateCondition(condition.id, { value: range })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )
        }
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {condition.value ? format(new Date(condition.value as string), "MMM dd, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={condition.value ? new Date(condition.value as string) : undefined}
                onSelect={(date) => {
                  if (date) {
                    updateCondition(condition.id, { value: date.toISOString() })
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        )

      case "number":
        if (condition.operator === "between") {
          return (
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={Array.isArray(condition.value) ? condition.value[0] : ""}
                onChange={(e) => {
                  const currentValue = Array.isArray(condition.value) ? condition.value : ["", ""]
                  updateCondition(condition.id, { 
                    value: [e.target.value, currentValue[1] || ""]
                  })
                }}
              />
              <span>-</span>
              <Input
                type="number"
                placeholder="Max"
                value={Array.isArray(condition.value) ? condition.value[1] : ""}
                onChange={(e) => {
                  const currentValue = Array.isArray(condition.value) ? condition.value : ["", ""]
                  updateCondition(condition.id, { 
                    value: [currentValue[0] || "", e.target.value]
                  })
                }}
              />
            </div>
          )
        }
        return (
          <Input
            type="number"
            placeholder="Enter value"
            value={condition.value as string}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          />
        )

      default:
        return (
          <Input
            placeholder="Enter value"
            value={condition.value as string}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          />
        )
    }
  }

  const handleSaveFilter = () => {
    if (filterName.trim() && conditions.length > 0) {
      // Convert conditions to the format expected by user preferences
      const filters = {
        dateRange: { from: new Date(), to: new Date() }, // This would be extracted from conditions
        project: "",
        sklad: "",
        city: "",
        filial: "",
        status: ""
      }
      
      addSavedFilter(filterName.trim(), filters)
      setFilterName("")
      setSaveDialogOpen(false)
    }
  }

  const handleLoadSavedFilter = (savedFilter: any) => {
    // Convert saved filter to conditions
    // This would depend on how we structure the saved filters
    setConditions([]) // Placeholder
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t("advancedFilters")}</h3>
          {conditions.length > 0 && (
            <Badge variant="secondary">{conditions.length}</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Hide" : "Show"} Builder
          </Button>
          
          {conditions.length > 0 && (
            <>
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Filter Preset</DialogTitle>
                    <DialogDescription>
                      Give this filter preset a name so you can use it again later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Filter name"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
                      Save Filter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllConditions}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {conditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No filters applied</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={addCondition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <div key={condition.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {index > 0 && (
                      <Select
                        value={condition.logicalOperator || "AND"}
                        onValueChange={(value) => updateCondition(condition.id, { logicalOperator: value as "AND" | "OR" })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(condition.id, { field: value, operator: "contains", value: "" })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(condition.id, { operator: value as any, value: "" })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorOptions(condition.field).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex-1">
                      {renderValueInput(condition)}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addCondition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Condition
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Filters */}
      {preferences.savedFilters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookmarkCheck className="h-5 w-5" />
              Saved Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {preferences.savedFilters.map((savedFilter) => (
                <div key={savedFilter.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{savedFilter.name}</p>
                    <p className="text-sm text-gray-500">
                      Created {format(new Date(savedFilter.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadSavedFilter(savedFilter)}
                    >
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSavedFilter(savedFilter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
