"use client";

import { useEffect, useRef, useState } from 'react';

interface YandexMapProps {
  locations: Array<{
    id: number;
    lat: number;
    lng: number;
    expeditor: string;
    time: string;
    status?: string;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export function YandexMap({ 
  locations, 
  center, 
  zoom = 10, 
  height = "400px",
  className = ""
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Yandex Maps API
    const loadYandexMaps = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => {
          setIsLoaded(true);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=&lang=en_US';
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(() => {
          setIsLoaded(true);
        });
      };
      document.head.appendChild(script);
    };

    loadYandexMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !locations.length) return;

    // Calculate center if not provided
    const mapCenter = center || {
      lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
      lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length
    };

    // Create map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
    }

    mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: zoom
    });

    // Add placemarks for each location
    locations.forEach((location) => {
      const placemark = new window.ymaps.Placemark(
        [location.lat, location.lng],
        {
          balloonContent: `
            <div>
              <strong>Expeditor:</strong> ${location.expeditor}<br/>
              <strong>Time:</strong> ${new Date(location.time).toLocaleString()}<br/>
              <strong>Location:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
              ${location.status ? `<br/><strong>Status:</strong> ${location.status}` : ''}
            </div>
          `,
          iconContent: location.id.toString()
        },
        {
          preset: 'islands#blueCircleDotIcon',
          iconColor: '#3B82F6'
        }
      );

      mapInstanceRef.current.geoObjects.add(placemark);
    });

    // Fit map to show all markers
    if (locations.length > 1) {
      mapInstanceRef.current.setBounds(
        mapInstanceRef.current.geoObjects.getBounds(),
        {
          checkZoomRange: true,
          zoomMargin: 20
        }
      );
    }

  }, [isLoaded, locations, center, zoom]);

  if (!isLoaded) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg ${className}`}
      style={{ height }}
    />
  );
}