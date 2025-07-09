// Real Yandex Maps integration example
// This file shows how to integrate actual Yandex Maps API

export const YANDEX_MAPS_CONFIG = {
  apiKey: "YOUR_YANDEX_MAPS_API_KEY", // Get from https://developer.tech.yandex.ru/
  language: "ru_RU",
  version: "2.1",
  center: [41.2995, 69.2401], // Tashkent center coordinates
  zoom: 12,
}

// Load Yandex Maps API script
export const loadYandexMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.ymaps) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = `https://api-maps.yandex.ru/${YANDEX_MAPS_CONFIG.version}/?apikey=${YANDEX_MAPS_CONFIG.apiKey}&lang=${YANDEX_MAPS_CONFIG.language}`
    script.async = true

    script.onload = () => {
      window.ymaps.ready(() => {
        resolve()
      })
    }

    script.onerror = () => {
      reject(new Error("Failed to load Yandex Maps API"))
    }

    document.head.appendChild(script)
  })
}

// Initialize Yandex Map
export const initializeYandexMap = (container: HTMLElement) => {
  return new Promise((resolve) => {
    window.ymaps.ready(() => {
      const map = new window.ymaps.Map(
        container,
        {
          center: YANDEX_MAPS_CONFIG.center,
          zoom: YANDEX_MAPS_CONFIG.zoom,
          controls: ["zoomControl", "searchControl", "typeSelector", "fullscreenControl", "routeButtonControl"],
        },
        {
          searchControlProvider: "yandex#search",
        },
      )

      // Set map type to hybrid (satellite + labels)
      map.setType("yandex#hybrid")

      resolve(map)
    })
  })
}

// Add marker to map
export const addMarkerToMap = (map: any, location: any, index: number) => {
  const placemark = new window.ymaps.Placemark(
    [location.coordinates.lat, location.coordinates.lng],
    {
      balloonContentHeader: location.clientName,
      balloonContentBody: `
        <div>
          <p><strong>Address:</strong> ${location.address}</p>
          <p><strong>Visit Time:</strong> ${location.visitTime}</p>
          ${location.checkoutTime ? `<p><strong>Checkout:</strong> ${location.checkoutTime}</p>` : ""}
          <p><strong>Status:</strong> <span style="color: ${location.status === "delivered" ? "green" : "red"}">${location.status}</span></p>
          ${location.notes ? `<p><strong>Notes:</strong> ${location.notes}</p>` : ""}
        </div>
      `,
      balloonContentFooter: `Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}`,
      hintContent: location.clientName,
    },
    {
      preset: location.status === "delivered" ? "islands#greenCircleDotIcon" : "islands#redCircleDotIcon",
      iconCaption: `${index + 1}`,
    },
  )

  map.geoObjects.add(placemark)
  return placemark
}

// Add route between points
export const addRouteToMap = (map: any, locations: any[]) => {
  if (locations.length < 2) return

  const points = locations.map((loc) => [loc.coordinates.lat, loc.coordinates.lng])

  const multiRoute = new window.ymaps.multiRouter.MultiRoute(
    {
      referencePoints: points,
      params: {
        routingMode: "auto",
      },
    },
    {
      boundsAutoApply: true,
      routeActiveStrokeWidth: 6,
      routeActiveStrokeColor: "#ffb300",
    },
  )

  map.geoObjects.add(multiRoute)
  return multiRoute
}

// Usage example:
/*
import { loadYandexMapsAPI, initializeYandexMap, addMarkerToMap, addRouteToMap } from './real-yandex-integration'

const initMap = async () => {
  try {
    await loadYandexMapsAPI()
    const map = await initializeYandexMap(mapContainer)
    
    // Add markers
    locations.forEach((location, index) => {
      addMarkerToMap(map, location, index)
    })
    
    // Add route
    addRouteToMap(map, locations)
    
  } catch (error) {
    console.error('Map initialization failed:', error)
  }
}
*/
