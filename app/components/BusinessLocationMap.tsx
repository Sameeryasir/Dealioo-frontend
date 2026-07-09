"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type BusinessLocationMapProps = {
  latitude: number;
  longitude: number;
  label?: string;
};

const PIN_ICON = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#CC6E52;border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapViewportSync({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
}

export function BusinessLocationMap({
  latitude,
  longitude,
  label,
}: BusinessLocationMapProps) {
  const center: [number, number] = [latitude, longitude];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
      <div className="relative h-52 w-full sm:h-56">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewportSync center={center} zoom={14} />
          <Marker position={center} icon={PIN_ICON} />
        </MapContainer>
      </div>
      {label ? (
        <p className="border-t border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          {label}
        </p>
      ) : null}
    </div>
  );
}
