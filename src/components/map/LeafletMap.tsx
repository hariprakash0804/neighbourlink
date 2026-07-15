"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet marker icon issues (SVG-based markers instead of PNGs to match morphism)
const createCustomIcon = (color: string, isCenter: boolean = false) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        ${
          isCenter
            ? `
          <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-brand-primary/30 opacity-75"></span>
          <div class="relative flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary border-2 border-white shadow-lg">
            <div class="h-2 w-2 rounded-full bg-white"></div>
          </div>
        `
            : `
          <div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md transition-all hover:scale-110" style="background-color: ${color};">
            <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        `
        }
      </div>
    `,
    className: "custom-marker-icon",
    iconSize: isCenter ? [32, 32] : [28, 28],
    iconAnchor: isCenter ? [16, 16] : [14, 28],
    popupAnchor: isCenter ? [0, -16] : [0, -28],
  });
};

interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color?: string;
  popupContent?: React.ReactNode;
}

interface LeafletMapProps {
  center: [number, number];
  radiusMeters?: number;
  markers?: MapMarker[];
  zoom?: number;
}

// Helper component to auto-recenter and fit bounds
function MapController({ center, markers }: { center: [number, number]; markers?: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;

    if (markers && markers.length > 0) {
      // Create bounds including center and all markers
      const points: L.LatLngExpression[] = [center, ...markers.map(m => [m.lat, m.lng] as L.LatLngExpression)];
      const bounds = L.latLngBounds(points);
      
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 16,
        animate: true,
      });
    } else {
      map.setView(center, map.getZoom() || 14);
    }
  }, [center, markers, map]);

  return null;
}

export default function LeafletMap({ center, radiusMeters, markers = [], zoom = 14 }: LeafletMapProps) {
  const centerIcon = createCustomIcon("#6366f1", true);

  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-elevated border border-white/10 glass">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* Tile Layer — OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-filter dark:opacity-80 dark:invert"
        />

        {/* Center / User marker */}
        <Marker position={center} icon={centerIcon}>
          <Popup>
            <div className="text-xs font-semibold">Your Location</div>
          </Popup>
        </Marker>

        {/* Search radius circle */}
        {radiusMeters && (
          <Circle
            center={center}
            radius={radiusMeters}
            pathOptions={{
              fillColor: "var(--color-brand-primary)",
              fillOpacity: 0.08,
              color: "var(--color-brand-primary)",
              weight: 1.5,
              dashArray: "4, 6",
            }}
          />
        )}

        {/* Service/Vendor markers */}
        {markers.map((marker) => {
          const markerIcon = createCustomIcon(marker.color || "#8b5cf6", false);
          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={markerIcon}
            >
              <Popup>
                <div className="p-1 min-w-[150px]">
                  {marker.popupContent || (
                    <p className="text-xs font-bold text-text-primary">{marker.name}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Map Recenter Controller */}
        <MapController center={center} markers={markers} />
      </MapContainer>
    </div>
  );
}
