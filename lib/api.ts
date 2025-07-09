import type { Expeditor, Client, VisitedLocation, FilterOptions, Statistics, Project, Sklad, City } from "./types"

// Mock data - replace with real API calls
const mockExpeditors: Expeditor[] = [
  {
    id: "1",
    name: "Akmal Karimov",
    phone: "+998901234567",
    avatar: "/placeholder.svg",
    status: "active",
    transport_number: "01A123BC",
  },
  {
    id: "2",
    name: "Bobur Toshmatov",
    phone: "+998907654321",
    avatar: "/placeholder.svg",
    status: "active",
    transport_number: "01B456DE",
  },
  {
    id: "3",
    name: "Davron Umarov",
    phone: "+998909876543",
    avatar: "/placeholder.svg",
    status: "inactive",
    transport_number: "01C789FG",
  },
]

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
    project_name: "Express Service",
    project_description: "Fast delivery service",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const mockSklads: Sklad[] = [
  {
    id: "1",
    sklad_name: "Central Warehouse",
    sklad_code: "CW001",
    description: "Main warehouse in Tashkent",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    sklad_name: "North Warehouse",
    sklad_code: "NW002",
    description: "Northern district warehouse",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const mockCities: City[] = [
  {
    id: "1",
    city_name: "Tashkent",
    city_code: "TAS",
    description: "Capital city",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    city_name: "Samarkand",
    city_code: "SAM",
    description: "Historic city",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getExpeditors(): Promise<Expeditor[]> {
  await delay(500)
  return mockExpeditors
}

export async function getProjects(): Promise<Project[]> {
  await delay(300)
  return mockProjects
}

export async function getSklads(): Promise<Sklad[]> {
  await delay(300)
  return mockSklads
}

export async function getCities(): Promise<City[]> {
  await delay(300)
  return mockCities
}

export async function getExpeditorTodayChecksCount(expeditorId: string): Promise<number> {
  await delay(200)
  // Mock data - return random number between 0-15
  return Math.floor(Math.random() * 16)
}

export async function getClients(expeditorId: string, filters: FilterOptions): Promise<Client[]> {
  await delay(800)

  const mockClients: Client[] = [
    {
      id: "1",
      name: "Oybek Market",
      address: "Amir Temur ko'chasi 15, Tashkent",
      visitTime: "09:30",
      checkoutTime: "09:45",
      status: "delivered",
      check: {
        id: "1",
        check_id: "CHK001234567",
        project: "Tashkent Delivery",
        sklad: "Central Warehouse",
        city: "Tashkent",
        ekispiditor: "Akmal Karimov",
        agent: "Agent 001",
        sborshik: "Collector 001",
        transport_number: "01A123BC",
        kkm_number: "KKM001",
        yetkazilgan_vaqti: "2024-01-15T09:30:00Z",
        check_detail: {
          id: "1",
          check_id: "CHK001234567",
          checkURL: "https://check.soliq.uz/check/CHK001234567",
          check_date: "2024-01-15T09:30:00Z",
          check_lat: 41.2995,
          check_lon: 69.2401,
          total_sum: 150000,
          nalichniy: 100000,
          uzcard: 50000,
          humo: 0,
          click: 0,
          created_at: "2024-01-15T09:30:00Z",
          updated_at: "2024-01-15T09:30:00Z",
        },
      },
    },
    {
      id: "2",
      name: "Mega Planet",
      address: "Buyuk Ipak Yo'li 187, Tashkent",
      visitTime: "11:15",
      checkoutTime: "11:30",
      status: "delivered",
      check: {
        id: "2",
        check_id: "CHK001234568",
        project: "Express Service",
        sklad: "North Warehouse",
        city: "Tashkent",
        ekispiditor: "Akmal Karimov",
        agent: "Agent 002",
        sborshik: "Collector 002",
        transport_number: "01A123BC",
        kkm_number: "KKM002",
        yetkazilgan_vaqti: "2024-01-15T11:15:00Z",
        check_detail: {
          id: "2",
          check_id: "CHK001234568",
          checkURL: "https://check.soliq.uz/check/CHK001234568",
          check_date: "2024-01-15T11:15:00Z",
          check_lat: 41.3111,
          check_lon: 69.2797,
          total_sum: 275000,
          nalichniy: 0,
          uzcard: 175000,
          humo: 100000,
          click: 0,
          created_at: "2024-01-15T11:15:00Z",
          updated_at: "2024-01-15T11:15:00Z",
        },
      },
    },
    {
      id: "3",
      name: "Next Store",
      address: "Mustaqillik ko'chasi 45, Tashkent",
      visitTime: "14:20",
      status: "failed",
      check: {
        id: "3",
        check_id: "CHK001234569",
        project: "Tashkent Delivery",
        sklad: "Central Warehouse",
        city: "Tashkent",
        ekispiditor: "Akmal Karimov",
        agent: "Agent 001",
        sborshik: "Collector 001",
        transport_number: "01A123BC",
        kkm_number: "KKM003",
        yetkazilgan_vaqti: "2024-01-15T14:20:00Z",
        check_detail: {
          id: "3",
          check_id: "CHK001234569",
          checkURL: "https://check.soliq.uz/check/CHK001234569",
          check_date: "2024-01-15T14:20:00Z",
          check_lat: 41.2856,
          check_lon: 69.2034,
          total_sum: 85000,
          nalichniy: 85000,
          uzcard: 0,
          humo: 0,
          click: 0,
          created_at: "2024-01-15T14:20:00Z",
          updated_at: "2024-01-15T14:20:00Z",
        },
      },
    },
  ]

  return mockClients
}

export async function getVisitedLocations(expeditorId: string, filters: FilterOptions): Promise<VisitedLocation[]> {
  await delay(600)

  const mockLocations: VisitedLocation[] = [
    {
      id: "1",
      clientName: "Oybek Market",
      address: "Amir Temur ko'chasi 15, Tashkent",
      coordinates: { lat: 41.2995, lng: 69.2401 },
      visitTime: "09:30",
      checkoutTime: "09:45",
      status: "delivered",
      notes: "Successful delivery",
      check: {
        id: "1",
        check_id: "CHK001234567",
        project: "Tashkent Delivery",
        sklad: "Central Warehouse",
        city: "Tashkent",
        ekispiditor: "Akmal Karimov",
        agent: "Agent 001",
        sborshik: "Collector 001",
        transport_number: "01A123BC",
        kkm_number: "KKM001",
        yetkazilgan_vaqti: "2024-01-15T09:30:00Z",
        check_detail: {
          id: "1",
          check_id: "CHK001234567",
          checkURL: "https://check.soliq.uz/check/CHK001234567",
          check_date: "2024-01-15T09:30:00Z",
          check_lat: 41.2995,
          check_lon: 69.2401,
          total_sum: 150000,
          nalichniy: 100000,
          uzcard: 50000,
          humo: 0,
          click: 0,
          created_at: "2024-01-15T09:30:00Z",
          updated_at: "2024-01-15T09:30:00Z",
        },
      },
    },
    {
      id: "2",
      clientName: "Mega Planet",
      address: "Buyuk Ipak Yo'li 187, Tashkent",
      coordinates: { lat: 41.3111, lng: 69.2797 },
      visitTime: "11:15",
      checkoutTime: "11:30",
      status: "delivered",
      notes: "Quick delivery",
      check: {
        id: "2",
        check_id: "CHK001234568",
        project: "Express Service",
        sklad: "North Warehouse",
        city: "Tashkent",
        ekispiditor: "Akmal Karimov",
        agent: "Agent 002",
        sborshik: "Collector 002",
        transport_number: "01A123BC",
        kkm_number: "KKM002",
        yetkazilgan_vaqti: "2024-01-15T11:15:00Z",
        check_detail: {
          id: "2",
          check_id: "CHK001234568",
          checkURL: "https://check.soliq.uz/check/CHK001234568",
          check_date: "2024-01-15T11:15:00Z",
          check_lat: 41.3111,
          check_lon: 69.2797,
          total_sum: 275000,
          nalichniy: 0,
          uzcard: 175000,
          humo: 100000,
          click: 0,
          created_at: "2024-01-15T11:15:00Z",
          updated_at: "2024-01-15T11:15:00Z",
        },
      },
    },
    {
      id: "3",
      clientName: "Next Store",
      address: "Mustaqillik ko'chasi 45, Tashkent",
      coordinates: { lat: 41.2856, lng: 69.2034 },
      visitTime: "14:20",
      status: "failed",
      notes: "Customer not available",
      check: {
        id: "3",
        check_id: "CHK001234569",
        project: "Tashkent Delivery",
        sklad: "Central Warehouse",
        city: "Tashkent",
        ekispiditor: "Akmal Karimov",
        agent: "Agent 001",
        sborshik: "Collector 001",
        transport_number: "01A123BC",
        kkm_number: "KKM003",
        yetkazilgan_vaqti: "2024-01-15T14:20:00Z",
        check_detail: {
          id: "3",
          check_id: "CHK001234569",
          checkURL: "https://check.soliq.uz/check/CHK001234569",
          check_date: "2024-01-15T14:20:00Z",
          check_lat: 41.2856,
          check_lon: 69.2034,
          total_sum: 85000,
          nalichniy: 85000,
          uzcard: 0,
          humo: 0,
          click: 0,
          created_at: "2024-01-15T14:20:00Z",
          updated_at: "2024-01-15T14:20:00Z",
        },
      },
    },
  ]

  return mockLocations
}

export async function getStatistics(filters: FilterOptions): Promise<Statistics> {
  await delay(400)

  const mockStatistics: Statistics = {
    totalChecks: 156,
    totalSum: 12450000,
    deliveredChecks: 142,
    failedChecks: 14,
    paymentMethods: {
      nalichniy: 4500000,
      uzcard: 5200000,
      humo: 2100000,
      click: 650000,
    },
    topExpeditors: [
      { name: "Akmal Karimov", checksCount: 45, totalSum: 3200000 },
      { name: "Bobur Toshmatov", checksCount: 38, totalSum: 2800000 },
      { name: "Davron Umarov", checksCount: 32, totalSum: 2100000 },
    ],
    topProjects: [
      { name: "Tashkent Delivery", checksCount: 89, totalSum: 7200000 },
      { name: "Express Service", checksCount: 67, totalSum: 5250000 },
    ],
    topCities: [
      { name: "Tashkent", checksCount: 134, totalSum: 10200000 },
      { name: "Samarkand", checksCount: 22, totalSum: 2250000 },
    ],
    dailyStats: [
      { date: "2024-01-15", checksCount: 23, totalSum: 1850000 },
      { date: "2024-01-14", checksCount: 19, totalSum: 1420000 },
      { date: "2024-01-13", checksCount: 27, totalSum: 2100000 },
    ],
  }

  return mockStatistics
}
