import type { Check, Expeditor, Project, Sklad, City, Filial, Statistics } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"

// Request configuration
const REQUEST_CONFIG = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  cache: "no-store" as RequestCache,
}

// Safe request helper with better error handling and retry logic
async function apiRequestSafe<T>(endpoint: string, retries = 2): Promise<T | null> {
  const url = `${API_BASE_URL}${endpoint}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, REQUEST_CONFIG)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      return data as T
    } catch (err) {
      if (attempt === retries) {
        console.error(`API request failed for ${endpoint} after ${retries + 1} attempts:`, err)
        return null
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
    }
  }

  return null
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
  const data = await apiRequestSafe<Project[] | { results: any[] }>("/projects/")

  if (!data) return []

  // Handle both paginated and non-paginated responses
  const results = Array.isArray(data) ? data : data.results || []

  return results.map((item) => ({
    id: item.id?.toString() || "",
    project_name: item.project_name || "",
    project_description: item.project_description || "",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
  }))
}

// Sklads API
export async function getSklads(): Promise<Sklad[]> {
  const data = await apiRequestSafe<Sklad[] | { results: any[] }>("/sklad/")

  if (!data) return []

  const results = Array.isArray(data) ? data : data.results || []

  return results.map((item) => ({
    id: item.id?.toString() || "",
    sklad_name: item.sklad_name || "",
    sklad_code: item.sklad_code || "",
    description: item.description || "",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
  }))
}

// Cities API
export async function getCities(): Promise<City[]> {
  const data = await apiRequestSafe<City[] | { results: any[] }>("/city/")

  if (!data) return []

  const results = Array.isArray(data) ? data : data.results || []

  return results.map((item) => ({
    id: item.id?.toString() || "",
    city_name: item.city_name || "",
    city_code: item.city_code || "",
    description: item.description || "",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
  }))
}

// Filials API
export async function getFilials(): Promise<Filial[]> {
  const data = await apiRequestSafe<Filial[] | { results: any[] }>("/filial/")

  if (!data) return []

  const results = Array.isArray(data) ? data : data.results || []

  return results.map((item) => ({
    id: item.id?.toString() || "",
    filial_name: item.filial_name || "",
    filial_code: item.filial_code || "",
  }))
}

// Expeditors API with optimized filtering
export async function getExpeditors(filialId?: string, hasChecks = false): Promise<Expeditor[]> {
  let endpoint = "/ekispiditor/"
  const params = new URLSearchParams()

  if (filialId && filialId !== "all") {
    params.append("filial", filialId)
  }

  if (hasChecks) {
    params.append("has_checks", "true")
  }

  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }

  const data = await apiRequestSafe<Expeditor[] | { results: any[] }>(endpoint)

  if (!data) return []

  const results = Array.isArray(data) ? data : data.results || []

  return results.map(transformExpeditor)
}

// Checks API with proper filtering and no pagination
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
  const queryParams = new URLSearchParams()

  if (filters) {
    // Expeditor ID filter
    if (filters.expeditor_id) {
      queryParams.append("ekispiditor_id", filters.expeditor_id)
    }

    // Date range filters
    if (filters.dateRange?.from) {
      const fromDate = new Date(filters.dateRange.from)
      fromDate.setHours(0, 0, 0, 0)
      queryParams.append("date_from", fromDate.toISOString())
    }
    if (filters.dateRange?.to) {
      const toDate = new Date(filters.dateRange.to)
      toDate.setHours(23, 59, 59, 999)
      queryParams.append("date_to", toDate.toISOString())
    }

    // Other filters
    if (filters.project) queryParams.append("project", filters.project)
    if (filters.sklad) queryParams.append("sklad", filters.sklad)
    if (filters.city) queryParams.append("city", filters.city)
    if (filters.status) queryParams.append("status", filters.status)
    if (filters.search) queryParams.append("search", filters.search)
  }

  if (queryParams.toString()) {
    endpoint += `?${queryParams.toString()}`
  }

  const data = await apiRequestSafe<Check[] | { results: any[] }>(endpoint)

  if (!data) return []

  // Handle both array and paginated response
  const results = Array.isArray(data) ? data : data.results || []

  return results.map(transformCheck)
}

// Statistics API with optimized queries
export async function getStatistics(filters?: any): Promise<Statistics> {
  let endpoint = "/statistics/"
  const queryParams = new URLSearchParams()

  if (filters) {
    if (filters.expeditor_id) {
      queryParams.append("ekispiditor_id", filters.expeditor_id)
    }

    if (filters.dateRange?.from) {
      queryParams.append("date_from", filters.dateRange.from.toISOString())
    }
    if (filters.dateRange?.to) {
      queryParams.append("date_to", filters.dateRange.to.toISOString())
    }

    if (filters.project) queryParams.append("project", filters.project)
    if (filters.sklad) queryParams.append("sklad", filters.sklad)
    if (filters.city) queryParams.append("city", filters.city)
    if (filters.status) queryParams.append("status", filters.status)
  }

  if (queryParams.toString()) {
    endpoint += `?${queryParams.toString()}`
  }

  const data = await apiRequestSafe<any>(endpoint)

  if (data) {
    return {
      totalChecks: data.overview?.total_checks || 0,
      deliveredChecks: data.overview?.delivered_checks || 0,
      failedChecks: data.overview?.failed_checks || 0,
      pendingChecks: data.overview?.pending_checks || 0,
      totalSum: data.payment_stats?.total_sum || 0,
      todayChecks: data.overview?.today_checks_count || 0,
      successRate: data.overview?.success_rate || 0,
      avgCheckSum: data.overview?.avg_check_sum || 0,
      paymentMethods: {
        nalichniy: data.payment_stats?.nalichniy || 0,
        uzcard: data.payment_stats?.uzcard || 0,
        humo: data.payment_stats?.humo || 0,
        click: data.payment_stats?.click || 0,
      },
      topExpeditors: (data.top_expeditors || []).map((item: any) => ({
        name: item.ekispiditor || "",
        checkCount: item.check_count || 0,
        totalSum: item.total_sum || 0,
      })),
      topProjects: (data.top_projects || []).map((item: any) => ({
        name: item.project || "",
        checkCount: item.check_count || 0,
        totalSum: item.total_sum || 0,
      })),
      topCities: (data.top_cities || []).map((item: any) => ({
        name: item.city || "",
        checkCount: item.check_count || 0,
        totalSum: item.total_sum || 0,
      })),
      dailyStats: (data.daily_stats || []).map((item: any) => ({
        date: item.date || "",
        checks: item.checks || 0,
      })),
      topSklads: (data.top_sklads || []).map((item: any) => ({
        name: item.sklad || "",
        checkCount: item.check_count || 0,
        totalSum: item.total_sum || 0,
      })),
      hourlyStats: (data.hourly_stats || []).map((item: any) => ({
        hour: item.hour || "",
        checks: item.checks || 0,
      })),
      dowStats: (data.dow_stats || []).map((item: any) => ({
        dow: item.dow || 0,
        checks: item.checks || 0,
      })),
    }
  }

  return {
    totalChecks: 0,
    deliveredChecks: 0,
    failedChecks: 0,
    pendingChecks: 0,
    totalSum: 0,
    todayChecks: 0,
    successRate: 0,
    avgCheckSum: 0,
    paymentMethods: {
      nalichniy: 0,
      uzcard: 0,
      humo: 0,
      click: 0,
    },
    topExpeditors: [],
    topProjects: [],
    topCities: [],
    dailyStats: [],
    topSklads: [],
    hourlyStats: [],
    dowStats: [],
  }
}

export async function getGlobalStatistics(filters?: any): Promise<Statistics> {
  let endpoint = "/statistics/global/"
  const queryParams = new URLSearchParams()

  if (filters) {
    if (filters.dateRange?.from) {
      queryParams.append("date_from", filters.dateRange.from.toISOString())
    }
    if (filters.dateRange?.to) {
      queryParams.append("date_to", filters.dateRange.to.toISOString())
    }
    if (filters.project) queryParams.append("project", filters.project)
    if (filters.sklad) queryParams.append("sklad", filters.sklad)
    if (filters.city) queryParams.append("city", filters.city)
    if (filters.status) queryParams.append("status", filters.status)
  }

  if (queryParams.toString()) {
    endpoint += `?${queryParams.toString()}`
  }

  // Directly fetch global stats
  const data = await apiRequestSafe<any>(endpoint)
  if (data) {
    return {
      totalChecks: data.overview?.total_checks || 0,
      deliveredChecks: data.overview?.delivered_checks || 0,
      failedChecks: data.overview?.failed_checks || 0,
      pendingChecks: data.overview?.pending_checks || 0,
      totalSum: data.payment_stats?.total_sum || 0,
      todayChecks: data.overview?.today_checks_count || 0,
      successRate: data.overview?.success_rate || 0,
      avgCheckSum: data.overview?.avg_check_sum || 0,
      paymentMethods: {
        nalichniy: data.payment_stats?.nalichniy || 0,
        uzcard: data.payment_stats?.uzcard || 0,
        humo: data.payment_stats?.humo || 0,
        click: data.payment_stats?.click || 0,
      },
      topExpeditors: (data.top_expeditors || []).map((item: any) => ({
        name: item.ekispiditor || "",
        checkCount: item.check_count || 0,
        totalSum: item.total_sum || 0,
      })),
      topProjects: (data.top_projects || []).map((item: any) => ({
        name: item.project || "",
        checkCount: item.check_count || 0,
        totalSum: item.total_sum || 0,
      })),
      topCities: (data.top_cities || []).map((item: any) => ({
        name: item.city || "",
        checkCount: item.check_count || 0,
        totalSum: item.total_sum || 0,
      })),
      dailyStats: (data.daily_stats || []).map((item: any) => ({
        date: item.date || "",
        checks: item.checks || 0,
      })),
      topSklads: (data.top_sklads || []).map((item: any) => ({
        name: item.sklad || "",
        checkCount: item.check_count || 0,
        totalSum: item.total_sum || 0,
      })),
      hourlyStats: (data.hourly_stats || []).map((item: any) => ({
        hour: item.hour || "",
        checks: item.checks || 0,
      })),
      dowStats: (data.dow_stats || []).map((item: any) => ({
        dow: item.dow || 0,
        checks: item.checks || 0,
      })),
    }
  }

  return {
    totalChecks: 0,
    deliveredChecks: 0,
    failedChecks: 0,
    pendingChecks: 0,
    totalSum: 0,
    todayChecks: 0,
    successRate: 0,
    avgCheckSum: 0,
    paymentMethods: { nalichniy: 0, uzcard: 0, humo: 0, click: 0 },
    topExpeditors: [],
    topProjects: [],
    topCities: [],
    dailyStats: [],
    topSklads: [],
    hourlyStats: [],
    dowStats: [],
  }
}

// Export aliases for compatibility with stats page
export const fetchGlobalStatistics = getGlobalStatistics
export const fetchProjects = getProjects
export const fetchSklads = getSklads
export const fetchCities = getCities

// Export api object with all methods
export const api = {
  getProjects,
  getSklads,
  getCities,
  getExpeditors,
  getChecks,
  getStatistics,
  getGlobalStatistics,
  getFilials,
  fetchGlobalStatistics,
  fetchProjects,
  fetchSklads,
  fetchCities,
}
