"use client"

import { useState, useEffect } from 'react'

interface LocationData {
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
}

export function useLocationDetection() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords

      // Use reverse geocoding to get city information
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
        const data = await response.json()
        
        setLocation({
          city: data.city || data.locality || 'Unknown',
          region: data.principalSubdivision || 'Unknown',
          country: data.countryName || 'Unknown',
          latitude,
          longitude
        })
      } catch (geocodeError) {
        // Fallback: use coordinates to determine approximate location
        const approximateCity = getApproximateCityFromCoordinates(latitude, longitude)
        setLocation({
          city: approximateCity,
          region: 'Unknown',
          country: 'Uzbekistan',
          latitude,
          longitude
        })
      }
    } catch (err) {
      setError('Failed to get location')
      console.error('Location detection error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Approximate city detection based on coordinates for Uzbekistan
  const getApproximateCityFromCoordinates = (lat: number, lng: number): string => {
    // Major cities in Uzbekistan with approximate coordinates
    const cities = [
      { name: 'Tashkent', lat: 41.2995, lng: 69.2401, radius: 0.5 },
      { name: 'Fergana', lat: 40.3842, lng: 71.7842, radius: 0.3 },
      { name: 'Samarkand', lat: 39.6547, lng: 66.9597, radius: 0.3 },
      { name: 'Bukhara', lat: 39.7756, lng: 64.4286, radius: 0.3 },
      { name: 'Namangan', lat: 40.9983, lng: 71.6726, radius: 0.3 },
      { name: 'Andijan', lat: 40.7833, lng: 72.3333, radius: 0.3 },
      { name: 'Nukus', lat: 42.4531, lng: 59.6103, radius: 0.3 },
      { name: 'Karshi', lat: 38.8667, lng: 65.8000, radius: 0.3 },
      { name: 'Kokand', lat: 40.5286, lng: 70.9425, radius: 0.3 },
      { name: 'Margilan', lat: 40.4714, lng: 71.7247, radius: 0.3 },
    ]

    for (const city of cities) {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
      )
      if (distance <= city.radius) {
        return city.name
      }
    }

    return 'Unknown'
  }

  useEffect(() => {
    // Auto-detect location on mount
    detectLocation()
  }, [])

  return {
    location,
    loading,
    error,
    detectLocation,
    retry: detectLocation
  }
}