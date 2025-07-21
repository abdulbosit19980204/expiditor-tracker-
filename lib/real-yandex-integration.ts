// Yandex Maps integration utilities
export interface YandexMapConfig {
  center: [number, number]
  zoom: number
  controls: string[]
}

export interface YandexPlacemark {
  coordinates: [number, number]
  properties: {
    balloonContentHeader?: string
    balloonContentBody?: string
    balloonContentFooter?: string
  }
  options: {
    preset?: string
    iconColor?: string
  }
}

export const defaultMapConfig: YandexMapConfig = {
  center: [41.2995, 69.2401], // Tashkent
  zoom: 11,
  controls: ["zoomControl", "fullscreenControl", "typeSelector"],
}

export const loadYandexMaps = async (): Promise<void> => {
  if (window.ymaps) return

  try {
    // Load script from our API endpoint (server-side API key)
    const response = await fetch("/api/yandex-maps")
    const scriptContent = await response.text()

    // Execute the script
    const script = document.createElement("script")
    script.textContent = scriptContent
    document.head.appendChild(script)

    // Wait for ymaps to be available
    return new Promise((resolve, reject) => {
      const checkYmaps = () => {
        if (window.ymaps) {
          resolve()
        } else {
          setTimeout(checkYmaps, 100)
        }
      }
      checkYmaps()

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error("Yandex Maps failed to load")), 10000)
    })
  } catch (error) {
    console.error("Failed to load Yandex Maps:", error)
    throw error
  }
}

export const createPlacemark = (config: YandexPlacemark) => {
  if (!window.ymaps) throw new Error("Yandex Maps not loaded")

  return new window.ymaps.Placemark(config.coordinates, config.properties, config.options)
}

export const fitMapBounds = (map: any, geoObjects: any[]) => {
  if (!map || !geoObjects.length) return

  const bounds = map.geoObjects.getBounds()
  if (bounds) {
    map.setBounds(bounds, {
      checkZoomRange: true,
      margin: [20, 20, 20, 20],
    })
  }
}
