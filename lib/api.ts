import type { Check, Expeditor, Project, Sklad, City, Statistics } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Safe request helper – never throws, returns null on error
async function apiRequestSafe<T>(endpoint: string): Promise<T | null> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store", // Disable caching for real-time data
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    return data as T
  } catch (err) {
    console.warn(`API request failed for ${endpoint}:`, err)
    return null
  }
}

// Projects API
export async function getProjects(): Promise<Project[]> {
  const data = await apiRequestSafe<Project[]>("/projects/")

  // Return mock data if API fails
  return (
    data || [
      {
        id: "1",
        project_name: "Loyiha 1",
        project_description: "Birinchi loyiha",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        project_name: "Loyiha 2",
        project_description: "Ikkinchi loyiha",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        project_name: "Loyiha 3",
        project_description: "Uchinchi loyiha",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  )
}

// Sklads API
export async function getSklads(): Promise<Sklad[]> {
  const data = await apiRequestSafe<Sklad[]>("/sklad/")

  return (
    data || [
      {
        id: "1",
        sklad_name: "Sklad 1",
        sklad_code: "SKL001",
        description: "Birinchi sklad",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        sklad_name: "Sklad 2",
        sklad_code: "SKL002",
        description: "Ikkinchi sklad",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        sklad_name: "Sklad 3",
        sklad_code: "SKL003",
        description: "Uchinchi sklad",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  )
}

// Cities API
export async function getCities(): Promise<City[]> {
  const data = await apiRequestSafe<City[]>("/city/")

  return (
    data || [
      {
        id: "1",
        city_name: "Toshkent",
        city_code: "TSH",
        description: "Poytaxt shahar",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        city_name: "Samarqand",
        city_code: "SMQ",
        description: "Tarixiy shahar",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        city_name: "Buxoro",
        city_code: "BUX",
        description: "Qadimiy shahar",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  )
}

// Expeditors API
export async function getExpeditors(): Promise<Expeditor[]> {
  const data = await apiRequestSafe<Expeditor[]>("/ekispiditor/")

  return (
    data || [
      {
        id: "1",
        name: "Alisher Karimov",
        phone_number: "+998901234567",
        transport_number: "T001ABC",
        photo: "/placeholder-user.jpg",
      },
      {
        id: "2",
        name: "Bobur Toshmatov",
        phone_number: "+998907654321",
        transport_number: "T002DEF",
        photo: "/placeholder-user.jpg",
      },
      {
        id: "3",
        name: "Sardor Rahimov",
        phone_number: "+998909876543",
        transport_number: "T003GHI",
        photo: "/placeholder-user.jpg",
      },
      {
        id: "4",
        name: "Jasur Abdullayev",
        phone_number: "+998905432109",
        transport_number: "T004JKL",
        photo: "/placeholder-user.jpg",
      },
    ]
  )
}

// Checks API
export async function getChecks(filters?: {
  dateFrom?: string
  dateTo?: string
  project?: string
  sklad?: string
  city?: string
  expeditor?: string
  status?: string
  paymentMethod?: string
  search?: string
}): Promise<Check[]> {
  let endpoint = "/check/"

  if (filters) {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value)
      }
    })

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`
    }
  }

  const data = await apiRequestSafe<Check[]>(endpoint)

  // Mock data fallback
  const mockChecks: Check[] = [
    {
      id: "1",
      check_id: "CHK001",
      project: "Loyiha 1",
      sklad: "Sklad 1",
      city: "Toshkent",
      sborshik: "Sborshik 1",
      agent: "Agent 1",
      ekispiditor: "Alisher Karimov",
      yetkazilgan_vaqti: new Date().toISOString(),
      transport_number: "T001ABC",
      kkm_number: "KKM001",
      check_date: new Date().toISOString(),
      check_lat: 41.2995,
      check_lon: 69.2401,
      total_sum: 150000,
      nalichniy: 50000,
      uzcard: 100000,
      humo: 0,
      click: 0,
      checkURL: "https://soliq.uz/check/CHK001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "2",
      check_id: "CHK002",
      project: "Loyiha 2",
      sklad: "Sklad 2",
      city: "Toshkent",
      sborshik: "Sborshik 2",
      agent: "Agent 2",
      ekispiditor: "Bobur Toshmatov",
      yetkazilgan_vaqti: new Date(Date.now() - 86400000).toISOString(),
      transport_number: "T002DEF",
      kkm_number: "KKM002",
      check_date: new Date(Date.now() - 86400000).toISOString(),
      check_lat: 41.3111,
      check_lon: 69.2797,
      total_sum: 200000,
      nalichniy: 0,
      uzcard: 150000,
      humo: 50000,
      click: 0,
      checkURL: "https://soliq.uz/check/CHK002",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "3",
      check_id: "CHK003",
      project: "Loyiha 1",
      sklad: "Sklad 1",
      city: "Samarqand",
      sborshik: "Sborshik 3",
      agent: "Agent 3",
      ekispiditor: "Sardor Rahimov",
      yetkazilgan_vaqti: new Date().toISOString(),
      transport_number: "T003GHI",
      kkm_number: "KKM003",
      check_date: new Date().toISOString(),
      check_lat: 39.627,
      check_lon: 66.975,
      total_sum: 300000,
      nalichniy: 100000,
      uzcard: 100000,
      humo: 50000,
      click: 50000,
      checkURL: "https://soliq.uz/check/CHK003",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "4",
      check_id: "CHK004",
      project: "Loyiha 3",
      sklad: "Sklad 3",
      city: "Buxoro",
      sborshik: "Sborshik 4",
      agent: "Agent 4",
      ekispiditor: "Jasur Abdullayev",
      yetkazilgan_vaqti: new Date().toISOString(),
      transport_number: "T004JKL",
      kkm_number: "KKM004",
      check_date: new Date().toISOString(),
      check_lat: 39.7747,
      check_lon: 64.4286,
      total_sum: 250000,
      nalichniy: 250000,
      uzcard: 0,
      humo: 0,
      click: 0,
      checkURL: "https://soliq.uz/check/CHK004",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const checks = data || mockChecks

  // Apply filters to mock data if API data is not available
  if (!data && filters) {
    return checks.filter((check) => {
      if (filters.project && check.project !== filters.project) return false
      if (filters.sklad && check.sklad !== filters.sklad) return false
      if (filters.city && check.city !== filters.city) return false
      if (filters.expeditor && check.ekispiditor !== filters.expeditor) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          check.check_id.toLowerCase().includes(searchLower) ||
          check.ekispiditor?.toLowerCase().includes(searchLower) ||
          check.project?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }

  return checks
}

// Check Details API
export async function getCheckDetails(): Promise<any[]> {
  const data = await apiRequestSafe<any[]>("/check-details/")
  return data || []
}

// Statistics API
export async function getStatistics(filters?: any): Promise<Statistics> {
  let endpoint = "/statistics/"

  if (filters) {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, String(value))
      }
    })

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`
    }
  }

  const data = await apiRequestSafe<Statistics>(endpoint)

  // Mock statistics fallback
  return (
    data || {
      totalChecks: 4,
      totalSum: 900000,
      todayChecks: 3,
      successRate: 100,
      paymentMethods: {
        nalichniy: 400000,
        uzcard: 350000,
        humo: 100000,
        click: 50000,
      },
      topExpeditors: [
        { name: "Alisher Karimov", checkCount: 1, totalSum: 150000 },
        { name: "Bobur Toshmatov", checkCount: 1, totalSum: 200000 },
        { name: "Sardor Rahimov", checkCount: 1, totalSum: 300000 },
        { name: "Jasur Abdullayev", checkCount: 1, totalSum: 250000 },
      ],
      topProjects: [
        { name: "Loyiha 1", checkCount: 2, totalSum: 450000 },
        { name: "Loyiha 2", checkCount: 1, totalSum: 200000 },
        { name: "Loyiha 3", checkCount: 1, totalSum: 250000 },
      ],
      topCities: [
        { name: "Toshkent", checkCount: 2, totalSum: 350000 },
        { name: "Samarqand", checkCount: 1, totalSum: 300000 },
        { name: "Buxoro", checkCount: 1, totalSum: 250000 },
      ],
    }
  )
}

// Export all API functions
export const api = {
  getProjects,
  getSklads,
  getCities,
  getExpeditors,
  getChecks,
  getCheckDetails,
  getStatistics,
}
