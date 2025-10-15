"use client"

import React from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "../lib/simple-i18n"

interface DatePickerWithRangeProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined } | undefined) => void
  className?: string
}

export function DatePickerWithRange({ dateRange, onDateRangeChange, className }: DatePickerWithRangeProps) {
  const { t } = useTranslation()
  const [startDate, setStartDate] = React.useState<Date | null>(dateRange.from || null)
  const [endDate, setEndDate] = React.useState<Date | null>(dateRange.to || null)

  React.useEffect(() => {
    setStartDate(dateRange.from || null)
    setEndDate(dateRange.to || null)
  }, [dateRange])

  const handleChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    onDateRangeChange(start || end ? { from: start || undefined, to: end || undefined } : undefined)
  }

  return (
    <div className={cn("relative", className)}>
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={handleChange}
        isClearable
        placeholderText={t("pickDateRange") || "Pick a date range"}
        className="pl-10 w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        dateFormat="MMM dd, yyyy"
      />
    </div>
  )
}