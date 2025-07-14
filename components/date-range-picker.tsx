"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined } | undefined) => void
  className?: string
}

export function DatePickerWithRange({ dateRange, onDateRangeChange, className }: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: dateRange.from,
    to: dateRange.to,
  })

  React.useEffect(() => {
    setDate({
      from: dateRange.from,
      to: dateRange.to,
    })
  }, [dateRange])

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    onDateRangeChange(newDate ? { from: newDate.from, to: newDate.to } : undefined)
  }

  const formatDateRange = () => {
    if (!date?.from) return "Pick a date range"

    try {
      if (date.to) {
        return `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd, yyyy")}`
      }
      return format(date.from, "MMM dd, yyyy")
    } catch (error) {
      console.warn("Date formatting error:", error)
      return "Invalid date"
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !date?.from && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{formatDateRange()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
