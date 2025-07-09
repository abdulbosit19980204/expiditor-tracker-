import type { Expeditor, Client, VisitedLocation, DateRange } from "./types"

// Mock data with more entries for better search testing
const mockExpeditors: Expeditor[] = [
  {
    id: "1",
    name: "Aziz Karimov",
    phone: "+998 90 123-45-67",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: "2",
    name: "Malika Tosheva",
    phone: "+998 91 234-56-78",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: "3",
    name: "Bobur Rahimov",
    phone: "+998 93 345-67-89",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "inactive",
  },
  {
    id: "4",
    name: "Nigora Abdullayeva",
    phone: "+998 94 456-78-90",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: "5",
    name: "Sardor Umarov",
    phone: "+998 95 567-89-01",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: "6",
    name: "Feruza Nazarova",
    phone: "+998 97 678-90-12",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "inactive",
  },
]

const mockClients: Record<string, Client[]> = {
  "1": [
    {
      id: "c1",
      name: "Tashkent Plaza",
      address: "Amir Temur ko'chasi, Toshkent",
      visitTime: "09:15",
      checkoutTime: "09:45",
      status: "delivered",
    },
    {
      id: "c2",
      name: "Mega Planet",
      address: "Labzak ko'chasi, Toshkent",
      visitTime: "10:30",
      checkoutTime: "11:00",
      status: "delivered",
    },
    {
      id: "c3",
      name: "Toshkent Tibbiyot Akademiyasi",
      address: "Farabi ko'chasi, Toshkent",
      visitTime: "14:15",
      status: "failed",
    },
    {
      id: "c4",
      name: "Samarkand Darvoza",
      address: "Samarkand Darvoza, Toshkent",
      visitTime: "16:30",
      checkoutTime: "17:00",
      status: "delivered",
    },
  ],
  "2": [
    {
      id: "c5",
      name: "Chorsu Bozori",
      address: "Chorsu, Eski Shahar",
      visitTime: "08:45",
      checkoutTime: "09:15",
      status: "delivered",
    },
    {
      id: "c6",
      name: "NBU Bank",
      address: "Shakhrisabz ko'chasi, Toshkent",
      visitTime: "11:30",
      checkoutTime: "12:00",
      status: "delivered",
    },
    {
      id: "c7",
      name: "Uzbekistan Hotel",
      address: "Buyuk Turon ko'chasi, Toshkent",
      visitTime: "13:45",
      status: "failed",
    },
    {
      id: "c8",
      name: "Next Store",
      address: "Nukus ko'chasi, Toshkent",
      visitTime: "15:20",
      checkoutTime: "15:50",
      status: "delivered",
    },
  ],
  "5": [
    {
      id: "c9",
      name: "Carrefour Samarkand Darvoza",
      address: "Samarkand Darvoza, Toshkent",
      visitTime: "10:00",
      checkoutTime: "10:30",
      status: "delivered",
    },
    {
      id: "c10",
      name: "Makro Market",
      address: "Chilonzor tumani, Toshkent",
      visitTime: "12:15",
      checkoutTime: "12:45",
      status: "delivered",
    },
    {
      id: "c11",
      name: "Tashkent City Mall",
      address: "Shaykhontohur tumani, Toshkent",
      visitTime: "14:30",
      status: "failed",
    },
  ],
}

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
    },
    {
      id: "l3",
      clientName: "Toshkent Tibbiyot Akademiyasi",
      address: "Farabi ko'chasi, Toshkent",
      coordinates: { lat: 41.295543, lng: 69.267107 },
      visitTime: "14:15",
      status: "failed",
      notes: "Recipient not available",
    },
    {
      id: "l4",
      clientName: "Samarkand Darvoza",
      address: "Samarkand Darvoza, Toshkent",
      coordinates: { lat: 41.28543, lng: 69.203735 },
      visitTime: "16:30",
      checkoutTime: "17:00",
      status: "delivered",
      notes: "Delivered successfully",
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
    },
    {
      id: "l6",
      clientName: "NBU Bank",
      address: "Shakhrisabz ko'chasi, Toshkent",
      coordinates: { lat: 41.304223, lng: 69.249755 },
      visitTime: "11:30",
      checkoutTime: "12:00",
      status: "delivered",
    },
    {
      id: "l7",
      clientName: "Uzbekistan Hotel",
      address: "Buyuk Turon ko'chasi, Toshkent",
      coordinates: { lat: 41.299496, lng: 69.240562 },
      visitTime: "13:45",
      status: "failed",
      notes: "Security did not allow entry",
    },
    {
      id: "l8",
      clientName: "Next Store",
      address: "Nukus ko'chasi, Toshkent",
      coordinates: { lat: 41.315, lng: 69.25 },
      visitTime: "15:20",
      checkoutTime: "15:50",
      status: "delivered",
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
    },
    {
      id: "l10",
      clientName: "Makro Market",
      address: "Chilonzor tumani, Toshkent",
      coordinates: { lat: 41.275, lng: 69.21 },
      visitTime: "12:15",
      checkoutTime: "12:45",
      status: "delivered",
    },
    {
      id: "l11",
      clientName: "Tashkent City Mall",
      address: "Shaykhontohur tumani, Toshkent",
      coordinates: { lat: 41.32, lng: 69.28 },
      visitTime: "14:30",
      status: "failed",
      notes: "Mall was closed for maintenance",
    },
  ],
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getExpeditors(): Promise<Expeditor[]> {
  await delay(800)
  return mockExpeditors
}

export async function getClients(expeditorId: string, dateRange: DateRange): Promise<Client[]> {
  await delay(600)
  return mockClients[expeditorId] || []
}

export async function getVisitedLocations(expeditorId: string, dateRange: DateRange): Promise<VisitedLocation[]> {
  await delay(700)
  return mockLocations[expeditorId] || []
}
