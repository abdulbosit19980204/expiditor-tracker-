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
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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
    onDateRangeChange(start || end ? { from: start || undefined, to: end || undefined } : undefined)
  }

  return (
    <div className={cn("relative", className)}>
      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 h-5 w-5 pointer-events-none" />
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={handleChange}
        isClearable
        placeholderText="Pick a date range"
        className={cn(
          "pl-12 w-full bg-white border border-gray-200 rounded-xl shadow-sm py-2.5 px-4 text-base transition-all",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400",
          "hover:border-blue-400"
        )}
        dateFormat="MMM dd, yyyy"
        calendarClassName="rounded-xl shadow-lg border border-gray-200"
      />
    </div>
  )
}