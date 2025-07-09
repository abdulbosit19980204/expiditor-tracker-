export interface Expeditor {
  id: string
  name: string
  phone: string
  avatar?: string
  status: "active" | "inactive"
  transport_number: string
}

export interface Client {
  id: string
  name: string
  address: string
  visitTime: string
  checkoutTime?: string
  status: "delivered" | "failed"
  check?: Check
}

export interface VisitedLocation {
  id: string
  clientName: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  visitTime: string
  checkoutTime?: string
  status: "delivered" | "failed"
  notes?: string
  check: Check
}

export interface FilterOptions {
  dateRange: {
    from: Date
    to: Date
  }
  project?: string
  sklad?: string
  city?: string
  status?: string
  paymentMethod?: string
}

export interface Statistics {
  totalChecks: number
  totalSum: number
  deliveredChecks: number
  failedChecks: number
  paymentMethods: {
    nalichniy: number
    uzcard: number
    humo: number
    click: number
  }
  topExpeditors: Array<{
    name: string
    checksCount: number
    totalSum: number
  }>
  topProjects: Array<{
    name: string
    checksCount: number
    totalSum: number
  }>
  topCities: Array<{
    name: string
    checksCount: number
    totalSum: number
  }>
  dailyStats: Array<{
    date: string
    checksCount: number
    totalSum: number
  }>
}

// Django Backend Models
export interface Project {
  id: string
  project_name: string
  project_description?: string
  created_at: string
  updated_at: string
}

export interface CheckDetail {
  id: string
  check_id: string
  checkURL: string
  check_date: string
  check_lat?: number
  check_lon?: number
  total_sum?: number
  nalichniy?: number
  uzcard?: number
  humo?: number
  click?: number
  created_at: string
  updated_at: string
}

export interface Sklad {
  id: string
  sklad_name: string
  sklad_code: string
  description?: string
  created_at: string
  updated_at: string
}

export interface City {
  id: string
  city_name: string
  city_code: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Check {
  id: string
  check_id: string
  project?: string
  sklad?: string
  city?: string
  sborshik?: string
  agent?: string
  ekispiditor?: string
  yetkazilgan_vaqti?: string
  transport_number?: string
  kkm_number?: string
  check_detail?: CheckDetail
}
