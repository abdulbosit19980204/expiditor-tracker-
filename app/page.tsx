"use client"

import { useState, useEffect } from "react"
import type { Check, Expeditor, Project, Sklad, City } from "@/lib/types"
import { api } from "@/lib/api"

interface FilterState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  project: string
  sklad: string
  city: string
  expeditor: string
  status: string
  paymentMethod: string
  searchQuery: string
}

export default function ExpeditorTracker() {
  // State management
  const [checks, setChecks] = useState<Check[]>([])
  const [expeditors, setExpeditors] = useState<Expeditor[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [sklads, setSklads] = useState<Sklad[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null)
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false)
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { 
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      to: new Date() 
    },
    project: '',
    sklad: '',
    city: '',
    expeditor: '',
    status: '',
    paymentMethod: '',
    searchQuery: ''
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [checksData, expeditorsData, projectsData, skladsData, citiesData] = await Promise.all([
          api.getChecks(),
          api.getExpeditors(),
          api.getProjects(),
          api.getSklads(),
          api.getCities()
        ])

        setChecks(checksData)
        setExpeditors(expeditorsData)
        setProjects(projectsData)
        setSklads(skladsData)
        setCities(citiesData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter checks based on current filters
  const filteredChecks = checks.filter(check => {
    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const checkDate = new Date(check.check_date)
      if (filters.dateRange.from && checkDate < filters.dateRange.from) return false
      if (filters.dateRange.to && checkDate > filters.dateRange.to) return false
    }

    // Other filters
    if (filters.project && check.project !== filters.project) return false
    if (filters.sklad && check.sklad !== filters.sklad) return false
    if (filters.city && check.city !== filters.city) return false
    if (filters.expeditor && check.ekispiditor !== filters.expeditor) return false
    
    // Search filter
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase()
      const matchesSearch = 
        check.check_id.toLowerCase().includes(searchLower) ||
        check.ekispiditor?.toLowerCase().includes(searchLower) ||
        check.project?.toLowerCase().includes(searchLower) ||
        check.city?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

// Payment method filter
