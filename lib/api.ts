const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface Expeditor {
  id: number
  name: string
  phone: string
  photo?: string
  filial?: number
  filial_name?: string
}

export interface Check {
  id: number
  ekispiditor: string
  sana: string
  vaqt: string
  loyiha: string
  sklad: string
  shahar: string
  holat: string
  summa: number
  latitude?: number
  longitude?: number
}

export interface CheckDetail {
  id: number
  check: number
  tovar_nomi: string
  miqdor: number
  narx: number
  summa: number
}

export interface Filial {
  id: number
  name: string
  address?: string
}

export interface Statistics {
  total_checks: number
  total_amount: number
  status_distribution: Array<{ holat: string; count: number }>
  city_distribution: Array<{ shahar: string; count: number }>
  project_distribution: Array<{ loyiha: string; count: number }>
}

export interface FilterParams {
  expeditor_id?: number
  date_from?: string
  date_to?: string
  project?: string
  sklad?: string
  city?: string
  status?: string
  search?: string
  filial_id?: number
}

// Helper function to build query string
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value))
    }
  })

  return searchParams.toString()
}

// API functions
export async function getExpeditors(filters: FilterParams = {}): Promise<Expeditor[]> {
  try {
    const queryString = buildQueryString(filters)
    const url = `${API_BASE_URL}/expeditor/${queryString ? `?${queryString}` : ""}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.results || data || []
  } catch (error) {
    console.error("Error fetching expeditors:", error)
    return []
  }
}

export async function getChecks(filters: FilterParams = {}): Promise<Check[]> {
  try {
    const queryString = buildQueryString(filters)
    const url = `${API_BASE_URL}/check/${queryString ? `?${queryString}` : ""}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.results || data || []
  } catch (error) {
    console.error("Error fetching checks:", error)
    return []
  }
}

export async function getCheckDetails(checkId: number): Promise<CheckDetail[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/checkdetail/?check_id=${checkId}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.results || data || []
  } catch (error) {
    console.error("Error fetching check details:", error)
    return []
  }
}

export async function getFilials(): Promise<Filial[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/filial/`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.results || data || []
  } catch (error) {
    console.error("Error fetching filials:", error)
    return []
  }
}

export async function getStatistics(filters: FilterParams = {}): Promise<Statistics> {
  try {
    const queryString = buildQueryString(filters)
    const url = `${API_BASE_URL}/check/statistics/${queryString ? `?${queryString}` : ""}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return {
      total_checks: 0,
      total_amount: 0,
      status_distribution: [],
      city_distribution: [],
      project_distribution: [],
    }
  }
}
