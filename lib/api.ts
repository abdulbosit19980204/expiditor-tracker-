import type {
  Expeditor,
  Client,
  VisitedLocation,
  FilterOptions,
  Statistics,
  Project,
  Sklad,
  City,
  Check,
  CheckDetail,
} from "./types"

// Mock data with Django backend structure
const mockProjects: Project[] = [
  {
    id: "1",
    project_name: "Tashkent Delivery",
    project_description: "Main delivery project for Tashkent city",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    project_name: "Express Delivery",
    project_description: "Fast delivery service",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const mockSklads: Sklad[] = [
  {
    id: "1",
    sklad_name: "Chilonzor Sklad",
    sklad_code: "CHI001",
    description: "Main warehouse in Chilonzor",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    sklad_name: "Yunusobod Sklad",
    sklad_code: "YUN001",
    description: "Warehouse in Yunusobod",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const mockCities: City[] = [
  {
    id: "1",
    city_name: "Tashkent",
    city_code: "TSH",
    description: "Capital city",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    city_name: "Samarkand",
    city_code: "SMR",
    description: "Historical city",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const mockExpeditors: Expeditor[] = [
  {
    id: "1",
    name: "Aziz Karimov",
    phone: "+998 90 123-45-67",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    transport_number: "01A123BC",
  },
  {
    id: "2",
    name: "Malika Tosheva",
    phone: "+998 91 234-56-78",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    transport_number: "01B456DE",
  },
  {
    id: "3",
    name: "Bobur Rahimov",
    phone: "+998 93 345-67-89",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "inactive",
    transport_number: "01C789FG",
  },
  {
    id: "4",
    name: "Nigora Abdullayeva",
    phone: "+998 94 456-78-90",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    transport_number: "01D012HI",
  },
  {
    id: "5",
    name: "Sardor Umarov",
    phone: "+998 95 567-89-01",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    transport_number: "01E345JK",
  },
]

// Get today's date for filtering today's checks
const getTodayStart = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

const getTodayEnd = () => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return today
}

const mockCheckDetails: CheckDetail[] = [
  {
    id: "1",
    check_id: "CHK001",
    checkURL: "https://soliq.uz/check/CHK001",
    check_date: new Date().toISOString(),
    check_lat: 41.311081,
    check_lon: 69.240562,
    total_sum: 150000,
    nalichniy: 50000,
    uzcard: 100000,
    humo: 0,
    click: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    check_id: "CHK002",
    checkURL: "https://soliq.uz/check/CHK002",
    check_date: new Date().toISOString(),
    check_lat: 41.28543,
    check_lon: 69.203735,
    total_sum: 250000,
    nalichniy: 0,
    uzcard: 150000,
    humo: 100000,
    click: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    check_id: "CHK003",
    checkURL: "https://soliq.uz/check/CHK003",
    check_date: new Date().toISOString(),
    check_lat: 41.326142,
    check_lon: 69.228439,
    total_sum: 180000,
    nalichniy: 180000,
    uzcard: 0,
    humo: 0,
    click: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    check_id: "CHK004",
    checkURL: "https://soliq.uz/check/CHK004",
    check_date: new Date().toISOString(),
    check_lat: 41.304223,
    check_lon: 69.249755,
    total_sum: 320000,
    nalichniy: 120000,
    uzcard: 200000,
    humo: 0,
    click: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    check_id: "CHK005",
    checkURL: "https://soliq.uz/check/CHK005",
    check_date: new Date().toISOString(),
    check_lat: 41.275,
    check_lon: 69.21,
    total_sum: 95000,
    nalichniy: 0,
    uzcard: 0,
    humo: 95000,
    click: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockChecks: Check[] = [
  {
    id: "1",
    check_id: "CHK001",
    project: "Tashkent Delivery",
    sklad: "Chilonzor Sklad",
    city: "Tashkent",
    sborshik: "Olim Sobirov",
    agent: "Kamol Agents",
    ekispiditor: "Aziz Karimov",
    yetkazilgan_vaqti: new Date().toISOString(),
    transport_number: "01A123BC",
    kkm_number: "KKM001",
    check_detail: mockCheckDetails[0],
  },
  {
    id: "2",
    check_id: "CHK002",
    project: "Express Delivery",
    sklad: "Yunusobod Sklad",
    city: "Tashkent",
    sborshik: "Jasur Toshev",
    agent: "Fast Agents",
    ekispiditor: "Aziz Karimov",
    yetkazilgan_vaqti: new Date().toISOString(),
    transport_number: "01A123BC",
    kkm_number: "KKM002",
    check_detail: mockCheckDetails[1],
  },
  {
    id: "3",
    check_id: "CHK003",
    project: "Tashkent Delivery",
    sklad: "Chilonzor Sklad",
    city: "Tashkent",
    sborshik: "Aziza Rahimova",
    agent: "Quick Agents",
    ekispiditor: "Malika Tosheva",
    yetkazilgan_vaqti: new Date().toISOString(),
    transport_number: "01B456DE",
    kkm_number: "KKM003",
    check_detail: mockCheckDetails[2],
  },
  {
    id: "4",
    check_id: "CHK004",
    project: "Express Delivery",
    sklad: "Yunusobod Sklad",
    city: "Tashkent",
    sborshik: "Bobur Karimov",
    agent: "Speed Agents",
    ekispiditor: "Malika Tosheva",
    yetkazilgan_vaqti: new Date().toISOString(),
    transport_number: "01B456DE",
    kkm_number: "KKM004",
    check_detail: mockCheckDetails[3],
  },
  {
    id: "5",
    check_id: "CHK005",
    project: "Tashkent Delivery",
    sklad: "Chilonzor Sklad",
    city: "Tashkent",
    sborshik: "Sardor Usmanov",
    agent: "Pro Agents",
    ekispiditor: "Sardor Umarov",
    yetkazilgan_vaqti: new Date().toISOString(),
    transport_number: "01E345JK",
    kkm_number: "KKM005",
    check_detail: mockCheckDetails[4],
  },
]

const mockLocations: Record<string, VisitedLocation[]> = {
  "1": [
    {
      id: "l1",
      clientName: "Tashkent Plaza",
      address: "Amir Temur ko'chasi, Toshkent",
      coordinates: { lat: 41.311081, lng: 69.240562 },
      visitTime: "09:15",
      checkoutTime: "09:45",
      status: "delivered",
      notes: "Package delivered to reception",
      check: mockChecks[0],
    },
    {
      id: "l2",
      clientName: "Mega Planet",
      address: "Labzak ko'chasi, Toshkent",
      coordinates: { lat: 41.28543, lng: 69.203735 },
      visitTime: "10:30",
      checkoutTime: "11:00",
      status: "delivered",
      notes: "Delivered to loading dock",
      check: mockChecks[1],
    },
  ],
  "2": [
    {
      id: "l5",
      clientName: "Chorsu Bozori",
      address: "Chorsu, Eski Shahar",
      coordinates: { lat: 41.326142, lng: 69.228439 },
      visitTime: "08:45",
      checkoutTime: "09:15",
      status: "delivered",
      check: mockChecks[2],
    },
    {
      id: "l6",
      clientName: "NBU Bank",
      address: "Shakhrisabz ko'chasi, Toshkent",
      coordinates: { lat: 41.304223, lng: 69.249755 },
      visitTime: "11:30",
      checkoutTime: "12:00",
      status: "delivered",
      check: mockChecks[3],
    },
  ],
  "5": [
    {
      id: "l9",
      clientName: "Carrefour Samarkand Darvoza",
      address: "Samarkand Darvoza, Toshkent",
      coordinates: { lat: 41.28543, lng: 69.203735 },
      visitTime: "10:00",
      checkoutTime: "10:30",
      status: "delivered",
      check: mockChecks[4],
    },
  ],
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getProjects(): Promise<Project[]> {
  await delay(500)
  return mockProjects
}

export async function getSklads(): Promise<Sklad[]> {
  await delay(500)
  return mockSklads
}

export async function getCities(): Promise<City[]> {
  await delay(500)
  return mockCities
}

export async function getExpeditors(): Promise<Expeditor[]> {
  await delay(800)
  return mockExpeditors
}

export async function getExpeditorTodayChecksCount(expeditorId: string): Promise<number> {
  await delay(300)

  // Count today's checks for this expeditor
  const todayChecks = mockChecks.filter((check) => {
    const checkDate = new Date(check.check_detail?.check_date || check.yetkazilgan_vaqti || "")
    const today = new Date()
    return (
      check.ekispiditor === mockExpeditors.find((e) => e.id === expeditorId)?.name &&
      checkDate.toDateString() === today.toDateString()
    )
  })

  return todayChecks.length
}

export async function getClients(expeditorId: string, filters: FilterOptions): Promise<Client[]> {
  await delay(600)
  const locations = mockLocations[expeditorId] || []
  return locations.map((loc) => ({
    id: loc.id,
    name: loc.clientName,
    address: loc.address,
    visitTime: loc.visitTime,
    checkoutTime: loc.checkoutTime,
    status: loc.status,
    check: loc.check,
  }))
}

export async function getVisitedLocations(expeditorId: string, filters: FilterOptions): Promise<VisitedLocation[]> {
  await delay(700)
  return mockLocations[expeditorId] || []
}

export async function getStatistics(filters: FilterOptions): Promise<Statistics> {
  await delay(900)

  // Calculate statistics based on filters
  const allLocations = Object.values(mockLocations).flat()
  const filteredLocations = allLocations.filter((loc) => {
    if (filters.status && filters.status !== "all" && loc.status !== filters.status) return false
    if (filters.project && loc.check.project !== filters.project) return false
    if (filters.city && loc.check.city !== filters.city) return false
    if (filters.sklad && loc.check.sklad !== filters.sklad) return false
    return true
  })

  const totalSum = filteredLocations.reduce((sum, loc) => sum + (loc.check.check_detail?.total_sum || 0), 0)
  const deliveredChecks = filteredLocations.filter((loc) => loc.status === "delivered").length
  const failedChecks = filteredLocations.filter((loc) => loc.status === "failed").length

  const paymentMethods = filteredLocations.reduce(
    (acc, loc) => {
      const detail = loc.check.check_detail
      if (detail) {
        acc.nalichniy += detail.nalichniy || 0
        acc.uzcard += detail.uzcard || 0
        acc.humo += detail.humo || 0
        acc.click += detail.click || 0
      }
      return acc
    },
    { nalichniy: 0, uzcard: 0, humo: 0, click: 0 },
  )

  return {
    totalChecks: filteredLocations.length,
    totalSum,
    deliveredChecks,
    failedChecks,
    paymentMethods,
    topExpeditors: [
      { name: "Aziz Karimov", checksCount: 15, totalSum: 2500000 },
      { name: "Malika Tosheva", checksCount: 12, totalSum: 2100000 },
      { name: "Sardor Umarov", checksCount: 8, totalSum: 1800000 },
    ],
    topProjects: [
      { name: "Tashkent Delivery", checksCount: 25, totalSum: 4200000 },
      { name: "Express Delivery", checksCount: 18, totalSum: 3100000 },
    ],
    topCities: [
      { name: "Tashkent", checksCount: 35, totalSum: 6800000 },
      { name: "Samarkand", checksCount: 8, totalSum: 1500000 },
    ],
    dailyStats: [
      { date: "2024-01-15", checksCount: 12, totalSum: 1800000 },
      { date: "2024-01-14", checksCount: 15, totalSum: 2200000 },
      { date: "2024-01-13", checksCount: 10, totalSum: 1500000 },
    ],
  }
}
