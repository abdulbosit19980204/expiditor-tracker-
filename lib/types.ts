export interface Expeditor {
  id: string
  name: string
  phone: string
  avatar: string
  status: "active" | "inactive"
}

export interface Client {
  id: string
  name: string
  address: string
  visitTime: string
  checkoutTime?: string
  status: "delivered" | "failed"
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
}

export interface DateRange {
  from: Date
  to?: Date
}
