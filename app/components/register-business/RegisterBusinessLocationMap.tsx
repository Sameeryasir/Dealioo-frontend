"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type RegisterBusinessLocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  dropPinMode?: boolean;
  onDropPin?: (latitude: number, longitude: number) => void;
};

const DEFAULT_CENTER: [number, number] = [38.2776, -85.7372];

function buildPinIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1877F2;border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

const PIN_ICON = buildPinIcon();

function refreshMapSize(map: L.Map) {
  try {
    if (!map.getContainer()?.isConnected) return;
    map.invalidateSize({ animate: false });
  } catch {
    /* map may already be torn down */
  }
}

function MapViewportSync({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    refreshMapSize(map);

    const frame = window.requestAnimationFrame(() => refreshMapSize(map));
    const timers = [50, 200, 450].map((ms) =>
      window.setTimeout(() => refreshMapSize(map), ms),
    );
    const onResize = () => refreshMapSize(map);
    window.addEventListener("resize", onResize);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => refreshMapSize(map))
        : null;
    observer?.observe(container);
    if (container.parentElement) observer?.observe(container.parentElement);

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [map]);

  useEffect(() => {
    try {
      if (!map.getContainer()?.isConnected) return;
      map.setView(center, zoom, { animate: true });
      refreshMapSize(map);
    } catch {
      /* map may already be torn down */
    }
  }, [center, map, zoom]);

  return null;
}

function DropPinHandler({
  enabled,
  onDropPin,
}: {
  enabled: boolean;
  onDropPin?: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled || !onDropPin) return;
      onDropPin(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function RegisterBusinessLocationMap({
  latitude,
  longitude,
  dropPinMode = true,
  onDropPin,
}: RegisterBusinessLocationMapProps) {
  const hasPin = latitude != null && longitude != null;
  const center: [number, number] = useMemo(
    () => (hasPin ? [latitude!, longitude!] : DEFAULT_CENTER),
    [hasPin, latitude, longitude],
  );
  const zoom = hasPin ? 12 : 3;

  return (
    <div className="relative z-0 isolate h-64 w-full overflow-hidden rounded-xl border border-[#e8edf5]">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="!z-0 h-full w-full"
        style={{ height: "256px", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewportSync center={center} zoom={zoom} />
        <DropPinHandler enabled={dropPinMode} onDropPin={onDropPin} />
        {hasPin ? <Marker position={center} icon={PIN_ICON} /> : null}
      </MapContainer>

      {dropPinMode ? (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-[#1877f2] px-3 py-1.5 text-xs font-semibold text-white shadow">
          Click map to drop pin
        </div>
      ) : null}
    </div>
  );
}
