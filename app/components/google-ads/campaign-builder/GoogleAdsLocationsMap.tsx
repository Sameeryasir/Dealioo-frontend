"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type {
  GoogleAdsLocationRef,
  RadiusUnitId,
} from "@/app/components/google-ads/campaign-builder/location-targeting";
import "leaflet/dist/leaflet.css";

export type GoogleAdsMapPin = GoogleAdsLocationRef & {
  mode: "include" | "exclude";
};

type GoogleAdsLocationsMapProps = {
  locations: GoogleAdsMapPin[];
  activeLocationId: string | null;
  dropPinMode: boolean;
  onDropPin: (latitude: number, longitude: number) => void;
  onSelectPin?: (locationId: string) => void;
};

function buildPinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

const INCLUDE_PIN_ICON = buildPinIcon("#4285F4");
const EXCLUDE_PIN_ICON = buildPinIcon("#e11d48");

function toMeters(radius: number, unit: RadiusUnitId): number {
  if (unit === "MILES") return radius * 1609.34;
  return radius * 1000;
}

function clearLeafletContainer(root: HTMLElement | null) {
  if (!root) return;
  const leafletNode = root.querySelector(".leaflet-container") as
    | (HTMLElement & { _leaflet_id?: number })
    | null;
  if (!leafletNode) return;
  try {
    delete leafletNode._leaflet_id;
  } catch {
    /* ignore */
  }
  leafletNode.innerHTML = "";
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
    try {
      if (!map.getContainer()?.isConnected) return;
      map.setView(center, zoom, { animate: false });
    } catch {
      /* map may already be torn down */
    }
  }, [center, map, zoom]);

  return null;
}

function MapReadyFix() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (!map.getContainer()?.isConnected) return;
        map.invalidateSize();
      } catch {
        /* map may already be torn down */
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function DropPinHandler({
  enabled,
  onDropPin,
}: {
  enabled: boolean;
  onDropPin: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onDropPin(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function getAddressPins(locations: GoogleAdsMapPin[]) {
  return locations.filter(
    (loc) =>
      loc.type !== "country" &&
      typeof loc.latitude === "number" &&
      typeof loc.longitude === "number",
  );
}

function getActivePin(
  locations: GoogleAdsMapPin[],
  activeId: string | null,
): GoogleAdsMapPin | null {
  const pins = getAddressPins(locations);
  if (!pins.length) return null;
  return pins.find((loc) => loc.id === activeId) ?? pins[0] ?? null;
}

export function GoogleAdsLocationsMap({
  locations,
  activeLocationId,
  dropPinMode,
  onDropPin,
  onSelectPin,
}: GoogleAdsLocationsMapProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const activePin = useMemo(
    () => getActivePin(locations, activeLocationId),
    [activeLocationId, locations],
  );

  const addressPins = useMemo(() => getAddressPins(locations), [locations]);

  const center: [number, number] = activePin
    ? [activePin.latitude!, activePin.longitude!]
    : [38.2776, -85.7372];

  const zoom = activePin ? 11 : 4;
  const activeRadiusValue = Math.min(
    80,
    Math.max(1, activePin?.radiusValue ?? 16),
  );
  const activeRadiusUnit: RadiusUnitId =
    activePin?.radiusUnit === "MILES" ? "MILES" : "KILOMETERS";
  const circleMeters = toMeters(activeRadiusValue, activeRadiusUnit);

  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      setReady(false);
      clearLeafletContainer(shellRef.current);
      setMapKey((key) => key + 1);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="relative z-0 isolate h-64 w-full overflow-hidden rounded-lg border border-[#e8edf5]"
    >
      {!ready ? (
        <div className="flex h-full w-full items-center justify-center bg-[#f4f8ff] text-sm text-slate-500">
          Loading map…
        </div>
      ) : (
        <MapContainer
          key={mapKey}
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className="!z-0 h-full w-full"
          style={{ cursor: dropPinMode ? "crosshair" : "grab", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapReadyFix />
          <MapViewportSync center={center} zoom={zoom} />
          <DropPinHandler enabled={dropPinMode} onDropPin={onDropPin} />

          {addressPins.map((loc) => (
            <Marker
              key={`${loc.mode}-${loc.id}`}
              position={[loc.latitude!, loc.longitude!]}
              icon={
                loc.mode === "exclude" ? EXCLUDE_PIN_ICON : INCLUDE_PIN_ICON
              }
              eventHandlers={{
                click: () => onSelectPin?.(loc.id),
              }}
            />
          ))}

          {activePin && activePin.mode === "include" ? (
            <Circle
              center={[activePin.latitude!, activePin.longitude!]}
              radius={circleMeters}
              pathOptions={{
                color: "#4285F4",
                fillColor: "#4285F4",
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
          ) : null}
        </MapContainer>
      )}

      {dropPinMode ? (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-[#4285F4] px-3 py-1.5 text-xs font-semibold text-white shadow">
          Click map to drop pin
        </div>
      ) : null}
    </div>
  );
}
