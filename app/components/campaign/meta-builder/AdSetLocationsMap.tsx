"use client";

import { useEffect, useMemo } from "react";
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
  AdSetLocationTarget,
  MetaDistanceUnit,
} from "@/app/lib/meta-campaign-builder-types";
import { radiusToMeters } from "@/app/lib/meta-location-targeting";
import "leaflet/dist/leaflet.css";

type AdSetLocationsMapProps = {
  locations: AdSetLocationTarget[];
  activeLocationId: string | null;
  dropPinMode: boolean;
  onDropPin: (latitude: number, longitude: number) => void;
};

function buildPinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

const INCLUDE_PIN_ICON = buildPinIcon("#1877F2");
const EXCLUDE_PIN_ICON = buildPinIcon("#dc2626");

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

function getActivePin(
  locations: AdSetLocationTarget[],
  activeId: string | null,
) {
  const pins = locations.filter(
    (loc) =>
      loc.type === "address" &&
      loc.latitude != null &&
      loc.longitude != null,
  );
  if (!pins.length) return null;

  const active = pins.find((loc) => loc.id === activeId) ?? pins[0];
  if (active.latitude == null || active.longitude == null) return null;

  return active;
}

export function AdSetLocationsMap({
  locations,
  activeLocationId,
  dropPinMode,
  onDropPin,
}: AdSetLocationsMapProps) {
  const activePin = useMemo(
    () => getActivePin(locations, activeLocationId),
    [activeLocationId, locations],
  );

  const addressPins = useMemo(
    () =>
      locations.filter(
        (loc) =>
          loc.type === "address" &&
          loc.latitude != null &&
          loc.longitude != null,
      ),
    [locations],
  );

  const center: [number, number] = activePin
    ? [activePin.latitude!, activePin.longitude!]
    : [38.2776, -85.7372];

  const zoom = activePin ? 11 : 4;

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg border border-[#e8edf5]">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        style={{ cursor: dropPinMode ? "crosshair" : "grab" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewportSync center={center} zoom={zoom} />
        <DropPinHandler enabled={dropPinMode} onDropPin={onDropPin} />

        {addressPins.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude!, loc.longitude!]}
            icon={
              loc.mode === "exclude" ? EXCLUDE_PIN_ICON : INCLUDE_PIN_ICON
            }
          />
        ))}

        {activePin?.radius && activePin.distanceUnit ? (
          <Circle
            center={[activePin.latitude!, activePin.longitude!]}
            radius={radiusToMeters(
              activePin.radius,
              activePin.distanceUnit as MetaDistanceUnit,
            )}
            pathOptions={{
              color: activePin.mode === "exclude" ? "#dc2626" : "#1877F2",
              fillColor: activePin.mode === "exclude" ? "#dc2626" : "#1877F2",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        ) : null}
      </MapContainer>

      {dropPinMode ? (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-[#1877f2] px-3 py-1.5 text-xs font-semibold text-white shadow">
          Click map to drop pin
        </div>
      ) : null}
    </div>
  );
}
