import type { Check, Expeditor, Project, Sklad, City, Filial, Statistics } from "./types"

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
      cache: "no-store",
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

// Transform backend data to frontend format
function transformExpeditor(backendData: any): Expeditor {
  return {
    id: backendData.id?.toString() || "",
    name: backendData.ekispiditor_name || backendData.name || "",
    filial: backendData.filial || "Biriktirilmagan",
    phone_number: backendData.phone_number || "",
    transport_number: backendData.transport_number || "",
    photo: backendData.photo || "/placeholder-user.jpg",
  }
}

// Helper to transform each check item
function transformCheck(item: any): Check {
  return {
    id: item.id?.toString() || "",
    check_id: item.check_id || "",
    project: item.project || "",
    sklad: item.sklad || "",
    city: item.city || "",
    sborshik: item.sborshik || "",
    agent: item.agent || "",
    ekispiditor: item.ekispiditor || "",
    yetkazilgan_vaqti: item.yetkazilgan_vaqti || "",
    transport_number: item.transport_number || "",
    kkm_number: item.kkm_number || "",
    client_name: item.client_name || "",
    client_address: item.client_address || "",
    status: item.status || "",
    check_date: item.check_detail?.check_date || item.yetkazilgan_vaqti || "",
    check_lat: item.check_detail?.check_lat || item.check_lat || 0,
    check_lon: item.check_detail?.check_lon || item.check_lon || 0,
    total_sum: item.check_detail?.total_sum || 0,
    nalichniy: item.check_detail?.nalichniy || 0,
    uzcard: item.check_detail?.uzcard || 0,
    humo: item.check_detail?.humo || 0,
    click: item.check_detail?.click || 0,
    checkURL: item.check_detail?.checkURL || "",
    created_at: item.created_at || "",
    updated_at: item.updated_at || "",
  }
}

// Projects API
export async function getProjects(): Promise<Project[]> {
  const data = await apiRequestSafe<{
    count: number
    next: string | null
    previous: string | null
    results: any[]
  }>("/projects/")

  if (data && Array.isArray(data.results)) {
    return data.results.map((item) => ({
      id: item.id?.toString() || "",
      project_name: item.project_name || "",
      project_description: item.project_description || "",
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    }))
  }

  return [
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
  ]
}

// Sklads API
export async function getSklads(): Promise<Sklad[]> {
  const data = await apiRequestSafe<{
    count: number
    next: string | null
    previous: string | null
    results: any[]
  }>("/sklad/")

  if (data && Array.isArray(data.results)) {
    return data.results.map((item) => ({
      id: item.id?.toString() || "",
      sklad_name: item.sklad_name || "",
      sklad_code: item.sklad_code || "",
      description: item.description || "",
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    }))
  }

  return [
    {
      id: "1",
      sklad_name: "Sklad 1",
      sklad_code: "SKL001",
      description: "Birinchi sklad",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

// Cities API
export async function getCities(): Promise<City[]> {
  const data = await apiRequestSafe<{
    count: number
    next: string | null
    previous: string | null
    results: any[]
  }>("/city/")

  if (data && Array.isArray(data.results)) {
    return data.results.map((item) => ({
      id: item.id?.toString() || "",
      city_name: item.city_name || "",
      city_code: item.city_code || "",
      description: item.description || "",
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    }))
  }

  return [
    {
      id: "1",
      city_name: "Toshkent",
      city_code: "TSH",
      description: "Poytaxt shahar",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

// Filials API
export async function getFilials(): Promise<Filial[]> {
  const data = await apiRequestSafe<{
    count: number
    next: string | null
    previous: string | null
    results: any[]
  }>("/filial/")

  if (data && Array.isArray(data.results)) {
    return data.results.map((item) => ({
      id: item.id?.toString() || "",
      filial_name: item.filial_name || "",
      filial_code: item.filial_code || "",
    }))
  }

  return [
    {
      id: "1",
      filial_name: "Filial 1",
      filial_code: "FIL001",
    },
    {
      id: "2",
      filial_name: "Filial 2",
      filial_code: "FIL002",
    },
  ]
}

// Expeditors API
export async function getExpeditors(filial?: string): Promise<Expeditor[]> {
  let endpoint = "/ekispiditor/"

  if (filial && filial !== "all") {
    const queryParams = new URLSearchParams()
    queryParams.append("filial", filial)
    endpoint += `?${queryParams.toString()}`
  }

  const data = await apiRequestSafe<{
    count: number
    next: string | null
    previous: string | null
    results: any[]
  }>(endpoint)

  if (data && Array.isArray(data.results)) {
    return data.results.map(transformExpeditor)
  }

  return [
    {
      id: "1",
      name: "Alisher Karimov",
      phone_number: "+998901234567",
      transport_number: "T001ABC",
      photo: "/placeholder-user.jpg",
      filial: "Filial 1",
    },
    {
      id: "2",
      name: "Bobur Toshmatov",
      phone_number: "+998907654321",
      transport_number: "T002DEF",
      photo: "/placeholder-user.jpg",
      filial: "Filial 2",
    },
  ]
}

// Checks API
export async function getChecks(filters?: {
  expeditor_id?: string
  dateRange?: { from: Date | undefined; to: Date | undefined }
  project?: string
  sklad?: string
  city?: string
  status?: string
  search?: string
}): Promise<Check[]> {
  let endpoint = "/check/"

  if (filters) {
    const queryParams = new URLSearchParams()

    if (filters.expeditor_id) {
      queryParams.append("expeditor_id", filters.expeditor_id)
    }

    if (filters.dateRange?.from) {
      queryParams.append("date_from", filters.dateRange.from.toISOString().split("T")[0])
    }
    if (filters.dateRange?.to) {
      queryParams.append("date_to", filters.dateRange.to.toISOString().split("T")[0])
    }

    if (filters.project) queryParams.append("project", filters.project)
    if (filters.sklad) queryParams.append("sklad", filters.sklad)
    if (filters.city) queryParams.append("city", filters.city)
    if (filters.status) queryParams.append("status", filters.status)
    if (filters.search) queryParams.append("search", filters.search)

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`
    }
  }

  console.log(`Fetching checks from: ${API_BASE_URL}${endpoint}`)

  const data = await apiRequestSafe<{
    count: number
    next: string | null
    previous: string | null
    results: any[]
  }>(endpoint)

  if (data && Array.isArray(data.results)) {
    return data.results.map(transformCheck)
  }

  const now = new Date().toISOString()
  return [
    {
      id: "1",
      check_id: "CHK001",
      project: "Loyiha 1",
      sklad: "Sklad 1",
      city: "Toshkent",
      sborshik: "Sborshik 1",
      agent: "Agent 1",
      ekispiditor: "Alisher Karimov",
      yetkazilgan_vaqti: now,
      transport_number: "T001ABC",
      kkm_number: "KKM001",
      client_name: "Mijoz 1",
      client_address: "Toshkent, Chilonzor 1",
      check_date: now,
      check_lat: 41.2995,
      check_lon: 69.2401,
      total_sum: 150000,
      nalichniy: 50000,
      uzcard: 100000,
      humo: 0,
      click: 0,
      checkURL: "https://soliq.uz/check/CHK001",
      created_at: now,
      updated_at: now,
      status: "delivered",
    },
  ]
}

// Statistics API
export async function getStatistics(filters?: any): Promise<Statistics> {
  let endpoint = "/statistics/"

  if (filters) {
    const queryParams = new URLSearchParams()

    if (filters.expeditor_id) {
      queryParams.append("expeditor_id", filters.expeditor_id)
    }

    if (filters.dateRange?.from) {
      queryParams.append("date_from", filters.dateRange.from.toISOString().split("T")[0])
    }
    if (filters.dateRange?.to) {
      queryParams.append("date_to", filters.dateRange.to.toISOString().split("T")[0])
    }

    if (filters.project) queryParams.append("project", filters.project)
    if (filters.sklad) queryParams.append("sklad", filters.sklad)
    if (filters.city) queryParams.append("city", filters.city)
    if (filters.status) queryParams.append("status", filters.status)

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`
    }
  }

  const data = await apiRequestSafe<any>(endpoint)

  if (data) {
    return {
      totalChecks: data.overview?.total_checks || data.totalChecks || 0,
      deliveredChecks: data.overview?.delivered_checks || data.deliveredChecks || 0,
      failedChecks: data.overview?.failed_checks || data.failedChecks || 0,
      pendingChecks: data.overview?.pending_checks || data.pendingChecks || 0,
      totalSum: data.payment_stats?.total_sum || data.totalSum || 0,
      todayChecks: data.overview?.today_checks_count || data.todayChecks || 0,
      successRate: data.overview?.success_rate || data.successRate || 0,
      paymentMethods: {
        nalichniy: data.payment_stats?.nalichniy || data.paymentMethods?.nalichniy || 0,
        uzcard: data.payment_stats?.uzcard || data.paymentMethods?.uzcard || 0,
        humo: data.payment_stats?.humo || data.paymentMethods?.humo || 0,
        click: data.payment_stats?.click || data.paymentMethods?.click || 0,
      },
      topExpeditors: (data.top_expeditors || data.topExpeditors || []).map((item: any) => ({
        name: item.ekispiditor || item.name || "",
        checkCount: item.check_count || item.checkCount || 0,
        totalSum: item.total_sum || item.totalSum || 0,
      })),
      topProjects: (data.top_projects || data.topProjects || []).map((item: any) => ({
        name: item.project || item.name || "",
        checkCount: item.check_count || item.checkCount || 0,
        totalSum: item.total_sum || item.totalSum || 0,
      })),
      topCities: (data.top_cities || data.topCities || []).map((item: any) => ({
        name: item.city || item.name || "",
        checkCount: item.check_count || item.checkCount || 0,
        totalSum: item.total_sum || item.totalSum || 0,
      })),
      dailyStats: (data.daily_stats || data.dailyStats || []).map((item: any) => ({
        date: item.date || "",
        checks: item.checks || 0,
      })),
    }
  }

  return {
    totalChecks: 4,
    deliveredChecks: 4,
    failedChecks: 0,
    pendingChecks: 0,
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
    ],
    topProjects: [
      { name: "Loyiha 1", checkCount: 2, totalSum: 450000 },
      { name: "Loyiha 2", checkCount: 1, totalSum: 200000 },
    ],
    topCities: [
      { name: "Toshkent", checkCount: 2, totalSum: 350000 },
      { name: "Samarqand", checkCount: 1, totalSum: 300000 },
    ],
    dailyStats: [
      { date: "2025-01-19", checks: 3 },
      { date: "2025-01-18", checks: 1 },
    ],
  }
}

export const api = {
  getProjects,
  getSklads,
  getCities,
  getExpeditors,
  getChecks,
  getStatistics,
  getFilials,
}
