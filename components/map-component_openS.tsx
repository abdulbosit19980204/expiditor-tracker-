"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Navigation, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Check, Expeditor } from "@/lib/types";

interface MapComponentProps {
  checks: Check[];
  selectedExpeditor: Expeditor | null;
  loading: boolean;
  onCheckClick?: (check: Check) => void;
  focusLocation?: { lat: number; lng: number } | null;
}

// Helper: fly to focus
function FlyTo({ location }: { location: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 15);
    }
  }, [location, map]);
  return null;
}

// Marker icon
const icon = L.icon({
  iconUrl: "/marker-icon.png", // siz public papkaga Leaflet marker ikonkani joylang
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -30],
});

export function MapComponent({
  checks,
  selectedExpeditor,
  loading,
  onCheckClick,
  focusLocation,
}: MapComponentProps) {
  const hasChecks = Array.isArray(checks) && checks.length > 0;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[41.2995, 69.2401]}
        zoom={11}
        className="h-full w-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {hasChecks &&
          checks.map((c) =>
            c.check_lat && c.check_lon ? (
              <Marker
                key={c.id}
                position={[c.check_lat, c.check_lon]}
                icon={icon}
                eventHandlers={{
                  click: () => onCheckClick?.(c),
                }}
              >
                <Popup>
                  <div className="space-y-1">
                    <strong>Check {c.check_id}</strong>
                    <p>Expeditor: {c.ekispiditor || "-"}</p>
                    <p>Sum: {(c.total_sum || 0).toLocaleString()} UZS</p>
                    <p>Date: {new Date(c.check_date).toLocaleDateString()}</p>
                    <button
                      className="mt-2 text-blue-600 underline"
                      onClick={() => onCheckClick?.(c)}
                    >
                      Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}

        {focusLocation && <FlyTo location={focusLocation} />}
      </MapContainer>

      {(loading || !hasChecks) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-gray-600">
            {loading ? t("loadingChecksEllipsis") : t("noData")}
          </span>
        </div>
      )}

      {selectedExpeditor && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-64 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Navigation className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold">{selectedExpeditor.name}</h4>
              <p className="text-sm text-gray-600">
                {selectedExpeditor.transport_number}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {checks.length} checks
              </span>
            </div>
            <Badge variant="outline">
              {checks
                .reduce((sum, check) => sum + (check.total_sum || 0), 0)
                .toLocaleString()}{" "}
              UZS
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
