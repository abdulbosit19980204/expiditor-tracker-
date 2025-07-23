// "use client"

// import { useState, useEffect } from "react"
// import { Search, Users, MapPin, Receipt, Filter, ChevronDown, ChevronUp, X, Menu } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent } from "@/components/ui/card"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Separator } from "@/components/ui/separator"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
// import { LoadingSpinner } from "@/components/loading-spinner"
// import { MapComponent } from "@/components/map-component"
// import { DatePickerWithRange } from "@/components/date-range-picker"
// import { CheckModal } from "@/components/check-modal"
// import { StatisticsPanel } from "@/components/statistics-panel"
// import { useIsMobile } from "@/hooks/use-mobile"
// import type { Check, Expeditor, Project, Sklad, City, Statistics } from "@/lib/types"
// import { api } from "@/lib/api"

// interface FilterState {
//   dateRange: { from: Date | undefined; to: Date | undefined }
//   project: string
//   sklad: string
//   city: string
//   expeditor: string
//   status: string
//   paymentMethod: string
//   searchQuery: string
// }

// export default function ExpeditorTracker() {
//   const isMobile = useIsMobile()

//   // State management
//   const [checks, setChecks] = useState<Check[]>([])
//   const [expeditors, setExpeditors] = useState<Expeditor[]>([])
//   const [projects, setProjects] = useState<Project[]>([])
//   const [sklads, setSklads] = useState<Sklad[]>([])
//   const [cities, setCities] = useState<City[]>([])
//   const [statistics, setStatistics] = useState<Statistics | null>(null)
//   const [selectedCheck, setSelectedCheck] = useState<Check | null>(null)
//   const [selectedExpeditor, setSelectedExpeditor] = useState<Expeditor | null>(null)
//   const [isCheckModalOpen, setIsCheckModalOpen] = useState(false)
//   const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isFiltersOpen, setIsFiltersOpen] = useState(false)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//   const [expeditorSearchQuery, setExpeditorSearchQuery] = useState("")
//   const [checkSearchQuery, setCheckSearchQuery] = useState("")

//   const [filters, setFilters] = useState<FilterState>({
//     dateRange: {
//       from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
//       to: new Date(),
//     },
//     project: "",
//     sklad: "",
//     city: "",
//     expeditor: "",
//     status: "",
//     paymentMethod: "",
//     searchQuery: "",
//   })

//   // Load initial data
//   useEffect(() => {
//     const loadData = async () => {
//       setIsLoading(true)
//       try {
//         const [checksData, expeditorsData, projectsData, skladsData, citiesData, statisticsData] = await Promise.all([
//           api.getChecks(),
//           api.getExpeditors(),
//           api.getProjects(),
//           api.getSklads(),
//           api.getCities(),
//           api.getStatistics(),
//         ])

//         // Ensure arrays are properly set
//         setChecks(Array.isArray(checksData) ? checksData : [])
//         setExpeditors(Array.isArray(expeditorsData) ? expeditorsData : [])
//         setProjects(Array.isArray(projectsData) ? projectsData : [])
//         setSklads(Array.isArray(skladsData) ? skladsData : [])
//         setCities(Array.isArray(citiesData) ? citiesData : [])
//         setStatistics(statisticsData)

//         // Select first expeditor by default
//         if (Array.isArray(expeditorsData) && expeditorsData.length > 0) {
//           setSelectedExpeditor(expeditorsData[0])
//         }
//       } catch (error) {
//         console.error("Error loading data:", error)
//         // Set empty arrays as fallback
//         setChecks([])
//         setExpeditors([])
//         setProjects([])
//         setSklads([])
//         setCities([])
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     loadData()
//   }, [])

//   // Filter expeditors based on search
//   const filteredExpeditors = Array.isArray(expeditors)
//     ? expeditors.filter((expeditor) => {
//         if (!expeditorSearchQuery) return true
//         const searchLower = expeditorSearchQuery.toLowerCase()
//         return (
//           expeditor.name?.toLowerCase().includes(searchLower) ||
//           expeditor.phone_number?.includes(searchLower) ||
//           expeditor.transport_number?.toLowerCase().includes(searchLower)
//         )
//       })
//     : []

//   // Filter checks based on current filters and selected expeditor
//   const filteredChecks = Array.isArray(checks)
//     ? checks.filter((check) => {
//         // Expeditor filter
//         if (selectedExpeditor && check.ekispiditor !== selectedExpeditor.name) return false

//         // Date range filter
//         if (filters.dateRange.from || filters.dateRange.to) {
//           const checkDate = new Date(check.check_date)
//           if (filters.dateRange.from && checkDate < filters.dateRange.from) return false
//           if (filters.dateRange.to && checkDate > filters.dateRange.to) return false
//         }

//         // Other filters
//         if (filters.project && check.project !== filters.project) return false
//         if (filters.sklad && check.sklad !== filters.sklad) return false
//         if (filters.city && check.city !== filters.city) return false

//         // Search filter
//         if (checkSearchQuery) {
//           const searchLower = checkSearchQuery.toLowerCase()
//           const matchesSearch =
//             check.check_id?.toLowerCase().includes(searchLower) ||
//             check.project?.toLowerCase().includes(searchLower) ||
//             check.city?.toLowerCase().includes(searchLower) ||
//             check.kkm_number?.toLowerCase().includes(searchLower)
//           if (!matchesSearch) return false
//         }

//         return true
//       })
//     : []

//   // Count active filters
//   const activeFiltersCount = Object.values(filters).filter((value) => {
//     if (typeof value === "string") return value !== ""
//     if (typeof value === "object" && value !== null) {
//       return value.from !== undefined || value.to !== undefined
//     }
//     return false
//   }).length

//   // Clear all filters
//   const clearAllFilters = () => {
//     setFilters({
//       dateRange: { from: undefined, to: undefined },
//       project: "",
//       sklad: "",
//       city: "",
//       expeditor: "",
//       status: "",
//       paymentMethod: "",
//       searchQuery: "",
//     })
//     setCheckSearchQuery("")
//   }

//   // Handle check click
//   const handleCheckClick = (check: Check) => {
//     setSelectedCheck(check)
//     setIsCheckModalOpen(true)
//   }

//   // Handle show location
//   const handleShowLocation = (check: Check) => {
//     if (check.check_lat && check.check_lon) {
//       setFocusLocation({ lat: check.check_lat, lng: check.check_lon })
//     }
//   }

//   // Format currency
//   const formatCurrency = (amount: number) => {
//     return (
//       new Intl.NumberFormat("uz-UZ", {
//         style: "decimal",
//         minimumFractionDigits: 0,
//       }).format(amount) + " UZS"
//     )
//   }

//   // Get today's checks count for expeditor
//   const getTodayChecksCount = (expeditorName: string) => {
//     const today = new Date()
//     today.setHours(0, 0, 0, 0)
//     const tomorrow = new Date(today)
//     tomorrow.setDate(tomorrow.getDate() + 1)

//     return Array.isArray(checks)
//       ? checks.filter((check) => {
//           const checkDate = new Date(check.check_date)
//           return check.ekispiditor === expeditorName && checkDate >= today && checkDate < tomorrow
//         }).length
//       : 0
//   }

//   // Sidebar content component
//   const SidebarContent = () => (
//     <div className="h-full flex flex-col">
//       <div className="p-4 border-b border-gray-200">
//         <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
//           <Users className="h-5 w-5" />
//           Expeditor Tracker
//         </h1>

//         {/* Date Range Filter - Always Visible */}
//         <div className="mb-4">
//           <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
//           <DatePickerWithRange
//             dateRange={filters.dateRange}
//             onDateRangeChange={(range) =>
//               setFilters((prev) => ({ ...prev, dateRange: range || { from: undefined, to: undefined } }))
//             }
//           />
//         </div>

//         {/* Advanced Filters Toggle */}
//         <div className="mb-4">
//           <Button variant="outline" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="w-full justify-between">
//             <div className="flex items-center gap-2">
//               <Filter className="h-4 w-4" />
//               Advanced Filters
//               {activeFiltersCount > 0 && (
//                 <Badge variant="secondary" className="ml-2">
//                   {activeFiltersCount}
//                 </Badge>
//               )}
//             </div>
//             {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//           </Button>

//           {/* Collapsible Filters */}
//           {isFiltersOpen && (
//             <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
//               {/* Project Filter */}
//               <div>
//                 <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
//                 <Select
//                   value={filters.project}
//                   onValueChange={(value) => setFilters((prev) => ({ ...prev, project: value === "all" ? "" : value }))}
//                 >
//                   <SelectTrigger className="h-8">
//                     <SelectValue placeholder="All Projects" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Projects</SelectItem>
//                     {Array.isArray(projects) &&
//                       projects.map((project) => (
//                         <SelectItem key={project.id} value={project.project_name}>
//                           {project.project_name}
//                         </SelectItem>
//                       ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Sklad Filter */}
//               <div>
//                 <label className="text-xs font-medium text-gray-600 mb-1 block">Warehouse</label>
//                 <Select
//                   value={filters.sklad}
//                   onValueChange={(value) => setFilters((prev) => ({ ...prev, sklad: value === "all" ? "" : value }))}
//                 >
//                   <SelectTrigger className="h-8">
//                     <SelectValue placeholder="All Warehouses" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Warehouses</SelectItem>
//                     {Array.isArray(sklads) &&
//                       sklads.map((sklad) => (
//                         <SelectItem key={sklad.id} value={sklad.sklad_name}>
//                           {sklad.sklad_name}
//                         </SelectItem>
//                       ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* City Filter */}
//               <div>
//                 <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
//                 <Select
//                   value={filters.city}
//                   onValueChange={(value) => setFilters((prev) => ({ ...prev, city: value === "all" ? "" : value }))}
//                 >
//                   <SelectTrigger className="h-8">
//                     <SelectValue placeholder="All Cities" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Cities</SelectItem>
//                     {Array.isArray(cities) &&
//                       cities.map((city) => (
//                         <SelectItem key={city.id} value={city.city_name}>
//                           {city.city_name}
//                         </SelectItem>
//                       ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Clear Filters Button */}
//               {activeFiltersCount > 0 && (
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={clearAllFilters}
//                   className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
//                 >
//                   <X className="h-3 w-3 mr-1" />
//                   Clear All Filters
//                 </Button>
//               )}
//             </div>
//           )}
//         </div>

//         <Separator className="my-4" />

//         {/* Expeditor Search */}
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//           <Input
//             placeholder="Search expeditors..."
//             value={expeditorSearchQuery}
//             onChange={(e) => setExpeditorSearchQuery(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>

//       {/* Expeditors List */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-3">
//         {filteredExpeditors.map((expeditor) => (
//           <Card
//             key={expeditor.id}
//             className={`cursor-pointer transition-all hover:shadow-md ${
//               selectedExpeditor?.id === expeditor.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
//             }`}
//             onClick={() => {
//               setSelectedExpeditor(expeditor)
//               if (isMobile) {
//                 setIsSidebarOpen(false)
//               }
//             }}
//           >
//             <CardContent className="p-4">
//               <div className="flex items-center space-x-3">
//                 <Avatar>
//                   <AvatarImage src={expeditor.photo || "/placeholder-user.jpg"} />
//                   <AvatarFallback>
//                     {expeditor.name
//                       ?.split(" ")
//                       .map((n) => n[0])
//                       .join("") || "EX"}
//                   </AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">{expeditor.name}</p>
//                   <p className="text-sm text-gray-500">{expeditor.phone_number}</p>
//                   <p className="text-xs text-gray-400">{expeditor.transport_number}</p>

//                   {/* Today's checks count */}
//                   <div className="flex items-center gap-2 mt-2">
//                     <Receipt className="h-3 w-3 text-blue-500" />
//                     <span className="text-xs text-blue-600 font-medium">
//                       {getTodayChecksCount(expeditor.name)} checks today
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   )

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <LoadingSpinner size="lg" />
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Mobile Header */}
//       {isMobile && (
//         <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
//           <h1 className="text-lg font-semibold flex items-center gap-2">
//             <Users className="h-5 w-5" />
//             Expeditor Tracker
//           </h1>
//           <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
//             <SheetTrigger asChild>
//               <Button variant="outline" size="sm">
//                 <Menu className="h-4 w-4" />
//               </Button>
//             </SheetTrigger>
//             <SheetContent side="left" className="w-80 p-0">
//               <SidebarContent />
//             </SheetContent>
//           </Sheet>
//         </div>
//       )}

//       <div className={`flex ${isMobile ? "flex-col" : "h-screen"}`}>
//         {/* Desktop Sidebar */}
//         {!isMobile && (
//           <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//             <SidebarContent />
//           </div>
//         )}

//         {/* Main Content */}
//         <div className={`flex-1 ${isMobile ? "flex flex-col" : "flex"}`}>
//           {/* Map */}
//           <div className={`${isMobile ? "h-96" : "flex-1"} relative`}>
//             <MapComponent
//               checks={filteredChecks}
//               selectedExpeditor={selectedExpeditor}
//               loading={false}
//               onCheckClick={handleCheckClick}
//               focusLocation={focusLocation}
//             />
//           </div>

//           {/* Right Panel - Statistics and Checks */}
//           <div className={`${isMobile ? "flex-1" : "w-96"} bg-white border-l border-gray-200 flex flex-col`}>
//             {/* Statistics Panel */}
//             <div className={`${isMobile ? "border-b" : "h-1/2 border-b"} border-gray-200`}>
//               <StatisticsPanel statistics={statistics} />
//             </div>

//             {/* Checks List */}
//             <div className={`${isMobile ? "flex-1" : "h-1/2"} flex flex-col`}>
//               <div className="p-4 border-b border-gray-200">
//                 <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
//                   <MapPin className="h-5 w-5" />
//                   Checks
//                   {selectedExpeditor && <Badge variant="outline">{filteredChecks.length}</Badge>}
//                 </h2>

//                 {selectedExpeditor && (
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                     <Input
//                       placeholder="Search checks..."
//                       value={checkSearchQuery}
//                       onChange={(e) => setCheckSearchQuery(e.target.value)}
//                       className="pl-10"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div className="flex-1 overflow-y-auto p-4">
//                 {!selectedExpeditor ? (
//                   <div className="text-center text-gray-500 mt-8">
//                     <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//                     <p>Select an expeditor to view checks</p>
//                   </div>
//                 ) : filteredChecks.length === 0 ? (
//                   <div className="text-center text-gray-500 mt-8">
//                     <p>No checks found</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {filteredChecks.map((check) => (
//                       <Card key={check.id} className="hover:shadow-sm transition-shadow">
//                         <CardContent className="p-4">
//                           <div className="space-y-2">
//                             <div className="flex items-center justify-between">
//                               <Button
//                                 variant="link"
//                                 className="h-auto p-0 text-sm font-medium text-blue-600"
//                                 onClick={() => handleCheckClick(check)}
//                               >
//                                 {check.check_id}
//                               </Button>
//                               <Badge variant="outline" className="text-xs">
//                                 {new Date(check.check_date).toLocaleDateString()}
//                               </Badge>
//                             </div>

//                             <div className="text-xs text-gray-600 space-y-1">
//                               <p>
//                                 <strong>Project:</strong> {check.project}
//                               </p>
//                               <p>
//                                 <strong>City:</strong> {check.city}
//                               </p>
//                               <p>
//                                 <strong>KKM:</strong> {check.kkm_number}
//                               </p>
//                             </div>

//                             <div className="flex items-center justify-between">
//                               <span className="text-sm font-bold text-green-600">
//                                 {formatCurrency(check.total_sum || 0)}
//                               </span>
//                               {check.check_lat && check.check_lon && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="h-6 text-xs bg-transparent"
//                                   onClick={() => handleShowLocation(check)}
//                                 >
//                                   <MapPin className="h-3 w-3 mr-1" />
//                                   Show
//                                 </Button>
//                               )}
//                             </div>

//                             {/* Payment Methods */}
//                             <div className="text-xs text-gray-500 space-y-1">
//                               {(check.nalichniy || 0) > 0 && (
//                                 <div className="flex justify-between">
//                                   <span>Cash:</span>
//                                   <span>{formatCurrency(check.nalichniy || 0)}</span>
//                                 </div>
//                               )}
//                               {(check.uzcard || 0) > 0 && (
//                                 <div className="flex justify-between">
//                                   <span>UzCard:</span>
//                                   <span>{formatCurrency(check.uzcard || 0)}</span>
//                                 </div>
//                               )}
//                               {(check.humo || 0) > 0 && (
//                                 <div className="flex justify-between">
//                                   <span>Humo:</span>
//                                   <span>{formatCurrency(check.humo || 0)}</span>
//                                 </div>
//                               )}
//                               {(check.click || 0) > 0 && (
//                                 <div className="flex justify-between">
//                                   <span>Click:</span>
//                                   <span>{formatCurrency(check.click || 0)}</span>
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Check Modal */}
//       <CheckModal
//         check={selectedCheck}
//         isOpen={isCheckModalOpen}
//         onClose={() => {
//           setIsCheckModalOpen(false)
//           setSelectedCheck(null)
//         }}
//         onShowLocation={handleShowLocation}
//       />
//     </div>
//   )
// }

"use client"

import { useState, useEffect } from "react"
import { Search, Users, MapPin, Receipt, Filter, ChevronDown, ChevronUp, X, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LoadingSpinner } from "@/components/loading-spinner"
import { MapComponent } from "@/components/map-component"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { CheckModal } from "@/components/check-modal"
import { StatisticsPanel } from "@/components/statistics-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Check, Expeditor, Project, Sklad, City, Statistics } from "@/lib/types"
import { api } from "@/lib/api"

interface FilterState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  project: string
  sklad: string
  city: string
  expeditor: string
  status: string
  paymentMethod: string
  searchQuery: string
}

export default function ExpeditorTracker() {
  const isMobile = useIsMobile()

  // State management
  const [checks, setChecks] = useState<Check[]>([])
  const [expeditors, setExpeditors] = useState<Expeditor[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null)
  const [selectedExpeditor, setSelectedExpeditor] = useState<Expeditor | null>(null)
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false)
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expeditorSearchQuery, setExpeditorSearchQuery] = useState("")
  const [checkSearchQuery, setCheckSearchQuery] = useState("")

  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      to: new Date(),
    },
    project: "",
    sklad: "",
    city: "",
    expeditor: "",
    status: "",
    paymentMethod: "",
    searchQuery: "",
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [checksData, expeditorsData, projectsData, skladsData, citiesData, statisticsData] = await Promise.all([
          api.getChecks(),
          api.getExpeditors(),
          api.getProjects(),
          api.getSklads(),
          api.getCities(),
          api.getStatistics(),
        ])

        setChecks(Array.isArray(checksData) ? checksData : [])
        setExpeditors(Array.isArray(expeditorsData) ? expeditorsData : [])
        setProjects(Array.isArray(projectsData) ? projectsData : [])
        setSklads(Array.isArray(skladsData) ? skladsData : [])
        setCities(Array.isArray(citiesData) ? citiesData : [])
        setStatistics(statisticsData)

        if (Array.isArray(expeditorsData) && expeditorsData.length > 0) {
          setSelectedExpeditor(expeditorsData[0])
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setChecks([])
        setExpeditors([])
        setProjects([])
        setSklads([])
        setCities([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter checks based on current filters and selected expeditor
  const filteredChecks = Array.isArray(checks)
    ? checks.filter((check) => {
        // Date range filter
        if (filters.dateRange.from || filters.dateRange.to) {
          const checkDate = new Date(check.check_date)
          if (filters.dateRange.from && checkDate < filters.dateRange.from) return false
          if (filters.dateRange.to && checkDate > filters.dateRange.to) return false
        }
        // Other filters
        if (filters.project && check.project !== filters.project) return false
        if (filters.sklad && check.sklad !== filters.sklad) return false
        if (filters.city && check.city !== filters.city) return false
        // Search filter
        if (checkSearchQuery) {
          const searchLower = checkSearchQuery.toLowerCase()
          const matchesSearch =
            check.check_id?.toLowerCase().includes(searchLower) ||
            check.project?.toLowerCase().includes(searchLower) ||
            check.city?.toLowerCase().includes(searchLower) ||
            check.kkm_number?.toLowerCase().includes(searchLower)
          if (!matchesSearch) return false
        }
        return true
      })
    : []

  // Expeditor check count map (filterga mos)
  const expeditorCheckCountMap: Record<string, number> = {}
  filteredChecks.forEach((check) => {
    if (check.ekispiditor) {
      expeditorCheckCountMap[check.ekispiditor] = (expeditorCheckCountMap[check.ekispiditor] || 0) + 1
    }
  })

  // Expeditorlarni filterlangan checklar soniga qarab tartiblash
  const filteredExpeditors = Array.isArray(expeditors)
    ? expeditors
        .filter((expeditor) => {
          if (!expeditorSearchQuery) return true
          const searchLower = expeditorSearchQuery.toLowerCase()
          return (
            expeditor.name?.toLowerCase().includes(searchLower) ||
            expeditor.phone_number?.includes(searchLower) ||
            expeditor.transport_number?.toLowerCase().includes(searchLower)
          )
        })
        .sort((a, b) => {
          const countA = expeditorCheckCountMap[a.name] || 0
          const countB = expeditorCheckCountMap[b.name] || 0
          return countB - countA
        })
    : []
    // Ekispiditor tanlanganda, faqat shu expeditorning filterlangan checklarini ko‘rsatish
    const selectedExpeditorChecks = selectedExpeditor
    ? filteredChecks.filter((check) => check.ekispiditor === selectedExpeditor.name)
    : []


  // Filterga mos ravishda ekispiditorning zakazlar sonini hisoblash
  const getFilteredChecksCount = (expeditorName: string) => expeditorCheckCountMap[expeditorName] || 0

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
    setFilters({
      dateRange: { from: undefined, to: undefined },
      project: "",
      sklad: "",
      city: "",
      expeditor: "",
      status: "",
      paymentMethod: "",
      searchQuery: "",
    })
    setCheckSearchQuery("")
  }

  // Handle check click
  const handleCheckClick = (check: Check) => {
    setSelectedCheck(check)
    setIsCheckModalOpen(true)
  }

  // Handle show location
  const handleShowLocation = (check: Check) => {
    if (check.check_lat && check.check_lon) {
      setFocusLocation({ lat: check.check_lat, lng: check.check_lon })
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("uz-UZ", {
        style: "decimal",
        minimumFractionDigits: 0,
      }).format(amount) + " UZS"
    )
  }

  // Sidebar content component
  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Expeditor Tracker
        </h1>

        {/* Date Range Filter - Always Visible */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
          <DatePickerWithRange
            dateRange={filters.dateRange}
            onDateRangeChange={(range) =>
              setFilters((prev) => ({ ...prev, dateRange: range || { from: undefined, to: undefined } }))
            }
          />
        </div>

        {/* Advanced Filters Toggle */}
        <div className="mb-4">
          <Button variant="outline" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Collapsible Filters */}
          {isFiltersOpen && (
            <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
              {/* Project Filter */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
                <Select
                  value={filters.project}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, project: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {Array.isArray(projects) &&
                      projects.map((project) => (
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
                  value={filters.sklad}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, sklad: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {Array.isArray(sklads) &&
                      sklads.map((sklad) => (
                        <SelectItem key={sklad.id} value={sklad.sklad_name}>
                          {sklad.sklad_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
                <Select
                  value={filters.city}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, city: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {Array.isArray(cities) &&
                      cities.map((city) => (
                        <SelectItem key={city.id} value={city.city_name}>
                          {city.city_name}
                        </SelectItem>
                      ))}
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

        <Separator className="my-4" />

        {/* Expeditor Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search expeditors..."
            value={expeditorSearchQuery}
            onChange={(e) => setExpeditorSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Expeditors List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredExpeditors.map((expeditor) => (
          <Card
            key={expeditor.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedExpeditor?.id === expeditor.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => {
              setSelectedExpeditor(expeditor)
              if (isMobile) {
                setIsSidebarOpen(false)
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={expeditor.photo || "/placeholder-user.jpg"} />
                  <AvatarFallback>
                    {expeditor.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "EX"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{expeditor.name}</p>
                  <p className="text-sm text-gray-500">{expeditor.phone_number}</p>
                  <p className="text-xs text-gray-400">{expeditor.transport_number}</p>

                  {/* Filterga mos zakazlar soni */}
                  <div className="flex items-center gap-2 mt-2">
                    <Receipt className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">
                      {getFilteredChecksCount(expeditor.name)} checks
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Expeditor Tracker
          </h1>
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      )}

      <div className={`flex ${isMobile ? "flex-col" : "h-screen"}`}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <SidebarContent />
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${isMobile ? "flex flex-col" : "flex"}`}>
          {/* Map */}
          <div className={`${isMobile ? "h-96" : "flex-1"} relative`}>
            <MapComponent
              checks={filteredChecks}
              selectedExpeditor={selectedExpeditor}
              loading={false}
              onCheckClick={handleCheckClick}
              focusLocation={focusLocation}
            />
          </div>

          {/* Right Panel - Statistics and Checks */}
          <div className={`${isMobile ? "flex-1" : "w-96"} bg-white border-l border-gray-200 flex flex-col`}>
            {/* Statistics Panel */}
            <div className={`${isMobile ? "border-b" : "h-1/2 border-b"} border-gray-200`}>
              <StatisticsPanel statistics={statistics} />
            </div>

            {/* Checks List */}
            <div className={`${isMobile ? "flex-1" : "h-1/2"} flex flex-col`}>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Checks
                  {selectedExpeditor && <Badge variant="outline">{filteredChecks.length}</Badge>}
                </h2>

                {selectedExpeditor && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search checks..."
                      value={checkSearchQuery}
                      onChange={(e) => setCheckSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!selectedExpeditor ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Select an expeditor to view checks</p>
                  </div>
                ) : filteredChecks.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>No checks found</p >
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredChecks.map((check) => (
                      <Card key={check.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Button
                                variant="link"
                                className="h-auto p-0 text-sm font-medium text-blue-600"
                                onClick={() => handleCheckClick(check)}
                              >
                                {check.check_id}
                              </Button>
                              <Badge variant="outline" className="text-xs">
                                {new Date(check.check_date).toLocaleDateString()}
                              </Badge>
                            </div>

                            <div className="text-xs text-gray-600 space-y-1">
                              <p>
                                <strong>Project:</strong> {check.project}
                              </p>
                              <p>
                                <strong>City:</strong> {check.city}
                              </p>
                              <p>
                                <strong>KKM:</strong> {check.kkm_number}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-green-600">
                                {formatCurrency(check.total_sum || 0)}
                              </span>
                              {check.check_lat && check.check_lon && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs bg-transparent"
                                  onClick={() => handleShowLocation(check)}
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Show
                                </Button>
                              )}
                            </div>

                            {/* Payment Methods */}
                            <div className="text-xs text-gray-500 space-y-1">
                              {(check.nalichniy || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>Cash:</span>
                                  <span>{formatCurrency(check.nalichniy || 0)}</span>
                                </div>
                              )}
                              {(check.uzcard || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>UzCard:</span>
                                  <span>{formatCurrency(check.uzcard || 0)}</span>
                                </div>
                              )}
                              {(check.humo || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>Humo:</span>
                                  <span>{formatCurrency(check.humo || 0)}</span>
                                </div>
                              )}
                              {(check.click || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>Click:</span>
                                  <span>{formatCurrency(check.click || 0)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Check Modal */}
      <CheckModal
        check={selectedCheck}
        isOpen={isCheckModalOpen}
        onClose={() => {
          setIsCheckModalOpen(false)
          setSelectedCheck(null)
        }}
        onShowLocation={handleShowLocation}
      />
    </div>
  )
}