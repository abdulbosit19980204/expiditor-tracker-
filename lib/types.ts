// export interface Check {
//   id: string
//   check_id: string
//   project?: string
//   sklad?: string
//   city?: string
//   sborshik?: string
//   agent?: string
//   ekispiditor?: string
//   yetkazilgan_vaqti?: string
//   transport_number?: string
//   kkm_number?: string
//   check_date: string
//   check_lat?: number
//   check_lon?: number
//   total_sum?: number
//   nalichniy?: number
//   uzcard?: number
//   humo?: number
//   click?: number
//   checkURL?: string
//   created_at?: string
//   updated_at?: string
// }
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
  client_name?: string         // qo‘shildi
  client_address?: string      // qo‘shildi
  status?: string              // qo‘shildi
  check_date: string
  check_lat?: number
  check_lon?: number
  total_sum?: number
  nalichniy?: number
  uzcard?: number
  humo?: number
  click?: number
  checkURL?: string
  created_at?: string
  updated_at?: string
}


export interface Expeditor {
  id: string
  name: string
  phone_number: string
  transport_number: string
  photo?: string
}

export interface Project {
  id: string
  project_name: string
  project_description?: string
  created_at?: string
  updated_at?: string
}

export interface Sklad {
  id: string
  sklad_name: string
  sklad_code: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface City {
  id: string
  city_name: string
  city_code: string
  description?: string
  created_at?: string
  updated_at?: string
}



export interface FilterOptions {
  dateRange: { from: Date | undefined; to: Date | undefined }
  project: string
  sklad: string
  city: string
  status: string
  paymentMethod: string
}

// export interface Statistics {
//   totalChecks: number
//   totalSum: number
//   todayChecks: number
//   successRate: number
//   paymentMethods: {
//     nalichniy: number
//     uzcard: number
//     humo: number
//     click: number
//   }
//   topExpeditors: Array<{
//     name: string
//     checkCount: number
//     totalSum: number
//   }>
//   topProjects: Array<{
//     name: string
//     checkCount: number
//     totalSum: number
//   }>
//   topCities: Array<{
//     name: string
//     checkCount: number
//     totalSum: number
//   }>
// }

// Updated Statistics interface
export interface Statistics {
  totalChecks: number
  deliveredChecks: number
  failedChecks: number
  pendingChecks: number
  totalSum: number
  todayChecks: number
  successRate: number
  paymentMethods: {
    nalichniy: number
    uzcard: number
    humo: number
    click: number
  }
  topExpeditors: Array<{
    name: string
    checkCount: number
    totalSum: number
  }>
  topProjects: Array<{
    name: string
    checkCount: number
    totalSum: number
  }>
  topCities: Array<{
    name: string
    checkCount: number
    totalSum: number
  }>
  dailyStats: Array<{
    date: string
    checks: number
  }>
}
