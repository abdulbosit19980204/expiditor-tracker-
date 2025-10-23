// "use client"

// import * as React from "react"
// import { CalendarIcon } from "lucide-react"
// import { format } from "date-fns"
// import type { DateRange } from "react-day-picker"
// import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { Calendar } from "@/components/ui/calendar"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// interface DatePickerWithRangeProps {
//   dateRange: { from: Date | undefined; to: Date | undefined }
//   onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined } | undefined) => void
//   className?: string
// }

// export function DatePickerWithRange({ dateRange, onDateRangeChange, className }: DatePickerWithRangeProps) {
//   const [date, setDate] = React.useState<DateRange | undefined>({
//     from: dateRange.from,
//     to: dateRange.to,
//   })

//   React.useEffect(() => {
//     setDate({
//       from: dateRange.from,
//       to: dateRange.to,
//     })
//   }, [dateRange])

//   const handleDateChange = (newDate: DateRange | undefined) => {
//     setDate(newDate)
//     onDateRangeChange(newDate ? { from: newDate.from, to: newDate.to } : undefined)
//   }

//   const formatDateRange = () => {
//     if (!date?.from) return "Pick a date range"

//     if (date.to) {
//       return `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd, yyyy")}`
//     }

//     return format(date.from, "MMM dd, yyyy")
//   }

//   return (
//     <div className={cn("grid gap-2", className)}>
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button
//             id="date"
//             variant="outline"
//             className={cn(
//               "w-full justify-start text-left font-normal",
//               !date?.from && "text-muted-foreground"
//             )}
//           >
//             <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
//             <span className="truncate">{formatDateRange()}</span>
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-auto p-0" align="start">
//         <Calendar
//           mode="range"
//           defaultMonth={date?.from}
//           selected={date}
//           onSelect={handleDateChange}
//           numberOfMonths={2}
//           className="rounded-md border"
//           classNames={{
//             months: "flex flex-row space-x-4",
//             caption: "flex justify-center pt-1 relative items-center",
//             day_range_start: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
//             day_range_end: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
//             day_range_middle: "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
//           }}
//         />

//         </PopoverContent>
//       </Popover>
//     </div>
//   )
// }

"use client"

import * as React from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DatePickerWithRangeProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined } | undefined) => void
  className?: string
}

export function DatePickerWithRange({ dateRange, onDateRangeChange, className }: DatePickerWithRangeProps) {
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
    
    // Ensure dates are valid Date objects
    const validStart = start && start instanceof Date ? start : undefined
    const validEnd = end && end instanceof Date ? end : undefined
    
    onDateRangeChange(validStart || validEnd ? { from: validStart, to: validEnd } : undefined)
  }

  const handleTodayClick = () => {
    const today = new Date()
    setStartDate(today)
    setEndDate(today)
    onDateRangeChange({ from: today, to: today })
  }

  const formatDateRange = () => {
    if (!startDate || !(startDate instanceof Date)) return "Pick a date range"
    
    if (endDate && endDate instanceof Date && startDate.getTime() !== endDate.getTime()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    
    return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Modern styled date picker container */}
      <div className="relative group">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none z-10" />
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={handleChange}
          isClearable
          placeholderText="Pick a date range"
          className="pl-10 w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
          dateFormat="MMM dd, yyyy"
          popperClassName="modern-datepicker-popper"
          wrapperClassName="w-full"
        />
        {/* Custom overlay for better styling */}
        <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-transparent group-hover:ring-gray-200 transition-all duration-200" />
      </div>

      {/* Today button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTodayClick}
        className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200"
      >
        <Clock className="h-3.5 w-3.5 mr-2" />
        Today
      </Button>

      {/* Display selected range */}
      {(startDate || endDate) && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded-md py-1.5 px-2 border">
          <span className="font-medium">Selected:</span> {formatDateRange()}
        </div>
      )}

      <style jsx global>{`
        .modern-datepicker-popper {
          z-index: 9999 !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border-radius: 12px !important;
          border: 1px solid #e5e7eb !important;
        }
        
        .react-datepicker {
          border: none !important;
          border-radius: 12px !important;
          font-family: inherit !important;
        }
        
        .react-datepicker__header {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
          border-bottom: none !important;
          border-radius: 12px 12px 0 0 !important;
          color: white !important;
        }
        
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: white !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day {
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
        }
        
        .react-datepicker__day:hover {
          background-color: #dbeafe !important;
          color: #1d4ed8 !important;
        }
        
        .react-datepicker__day--selected {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
          color: white !important;
        }
        
        .react-datepicker__day--in-range {
          background-color: #dbeafe !important;
          color: #1d4ed8 !important;
        }
        
        .react-datepicker__day--range-start,
        .react-datepicker__day--range-end {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
          color: white !important;
        }
      `}</style>
    </div>
  )
}
