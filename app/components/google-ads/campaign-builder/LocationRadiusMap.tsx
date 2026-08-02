"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { RadiusUnitId } from "@/app/components/google-ads/campaign-builder/location-targeting";
import "leaflet/dist/leaflet.css";

type MapRadiusUnit = RadiusUnitId | "mile" | "kilometer";

type LocationRadiusMapProps = {
  latitude: number;
  longitude: number;
  radiusValue: number;
  radiusUnit: MapRadiusUnit;
  showRadius?: boolean;
  countryZoom?: boolean;
  focusToken: number;
  onPinMove: (latitude: number, longitude: number) => void;
  onRadiusChange?: (radiusValue: number) => void;
};

const MIN_RADIUS = 1;
const MAX_RADIUS = 80;

function toMeters(radius: number, unit: MapRadiusUnit): number {
  if (unit === "MILES" || unit === "mile") return radius * 1609.34;
  return radius * 1000;
}

function fromMeters(meters: number, unit: MapRadiusUnit): number {
  const raw =
    unit === "MILES" || unit === "mile" ? meters / 1609.34 : meters / 1000;
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, Math.round(raw)));
}

function offsetEast(
  latitude: number,
  longitude: number,
  meters: number,
): [number, number] {
  const earth = 6378137;
  const cosLat = Math.cos((Math.PI * latitude) / 180);
  const safeCos = Math.abs(cosLat) < 0.00001 ? 0.00001 : cosLat;
  const dLng = (meters / (earth * safeCos)) * (180 / Math.PI);
  return [latitude, longitude + dLng];
}

function createPinIcon() {
  return L.divIcon({
    className: "rp-map-pin-icon",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1877F2;border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function createRadiusHandleIcon() {
  return L.divIcon({
    className: "rp-map-radius-handle-icon",
    html: `<div title="Drag to resize radius" style="width:22px;height:22px;border-radius:9999px;background:#ffffff;border:3px solid #1877F2;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:ew-resize"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function isMapAlive(map: L.Map | null | undefined): map is L.Map {
  try {
    return Boolean(map && map.getContainer()?.isConnected && map.getPane("mapPane"));
  } catch {
    return false;
  }
}

function MapReadyFix() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isMapAlive(map)) return;
      try {
        map.invalidateSize();
      } catch {
        
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function FocusCamera({
  center,
  meters,
  showRadius,
  countryZoom,
  focusToken,
}: {
  center: [number, number];
  meters: number;
  showRadius: boolean;
  countryZoom: boolean;
  focusToken: number;
}) {
  const map = useMap();
  const lastTokenRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastTokenRef.current === focusToken) return;
    lastTokenRef.current = focusToken;

    if (!isMapAlive(map)) return;

    try {
      if (countryZoom || !showRadius) {
        map.setView(center, countryZoom ? 5 : 11, { animate: false });
        return;
      }

      const bounds = L.latLng(center[0], center[1]).toBounds(meters * 2);
      map.fitBounds(bounds, {
        padding: [48, 48],
        maxZoom: 13,
        animate: false,
      });
    } catch {
      
    }
  }, [center, countryZoom, focusToken, map, meters, showRadius]);

  return null;
}

function ClickToMovePin({
  suppressClickRef,
  onPinMove,
}: {
  suppressClickRef: MutableRefObject<boolean>;
  onPinMove: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (suppressClickRef.current) return;
      onPinMove(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function RadiusResizeHandle({
  center,
  meters,
  radiusUnit,
  suppressClickRef,
  onRadiusChange,
}: {
  center: [number, number];
  meters: number;
  radiusUnit: MapRadiusUnit;
  suppressClickRef: MutableRefObject<boolean>;
  onRadiusChange: (radiusValue: number) => void;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const draggingRef = useRef(false);
  const centerRef = useRef(center);
  const metersRef = useRef(meters);
  const unitRef = useRef(radiusUnit);
  const onRadiusChangeRef = useRef(onRadiusChange);

  centerRef.current = center;
  metersRef.current = meters;
  unitRef.current = radiusUnit;
  onRadiusChangeRef.current = onRadiusChange;

  useEffect(() => {
    if (!isMapAlive(map)) return;

    const marker = L.marker(
      offsetEast(centerRef.current[0], centerRef.current[1], metersRef.current),
      {
        icon: createRadiusHandleIcon(),
        draggable: true,
        zIndexOffset: 1000,
        keyboard: false,
      },
    );

    const updateFromLatLng = (latlng: L.LatLng) => {
      if (!isMapAlive(map)) return;
      const distanceMeters = map.distance(
        L.latLng(centerRef.current[0], centerRef.current[1]),
        latlng,
      );
      onRadiusChangeRef.current(fromMeters(distanceMeters, unitRef.current));
    };

    marker.on("dragstart", () => {
      draggingRef.current = true;
      suppressClickRef.current = true;
      map.dragging.disable();
    });

    marker.on("drag", (event) => {
      updateFromLatLng((event.target as L.Marker).getLatLng());
    });

    marker.on("dragend", (event) => {
      updateFromLatLng((event.target as L.Marker).getLatLng());
      if (isMapAlive(map)) {
        map.dragging.enable();
      }
      window.setTimeout(() => {
        draggingRef.current = false;
        suppressClickRef.current = false;
      }, 80);
    });

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      marker.off();
      marker.remove();
      markerRef.current = null;
      if (isMapAlive(map)) {
        map.dragging.enable();
      }
    };
  }, [map, suppressClickRef]);

  useEffect(() => {
    if (draggingRef.current || !markerRef.current) return;
    markerRef.current.setLatLng(
      offsetEast(center[0], center[1], meters),
    );
  }, [center, meters]);

  return null;
}

export function LocationRadiusMap({
  latitude,
  longitude,
  radiusValue,
  radiusUnit,
  showRadius = true,
  countryZoom = false,
  focusToken,
  onPinMove,
  onRadiusChange,
}: LocationRadiusMapProps) {
  const [mounted, setMounted] = useState(false);
  const center = useMemo(
    (): [number, number] => [latitude, longitude],
    [latitude, longitude],
  );
  const meters = toMeters(radiusValue, radiusUnit);
  const suppressClickRef = useRef(false);
  const pinIcon = useMemo(() => createPinIcon(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-xl border border-[#e8edf5] bg-[#f4f8ff] text-sm text-slate-500">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative z-0 isolate h-80 w-full overflow-hidden rounded-xl border border-[#e8edf5] bg-white">
      <MapContainer
        center={center}
        zoom={countryZoom ? 5 : 11}
        scrollWheelZoom
        doubleClickZoom
        dragging
        className="!z-0 h-full w-full"
        style={{ cursor: "grab", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapReadyFix />
        <FocusCamera
          center={center}
          meters={meters}
          showRadius={showRadius}
          countryZoom={countryZoom}
          focusToken={focusToken}
        />
        <ClickToMovePin
          suppressClickRef={suppressClickRef}
          onPinMove={onPinMove}
        />

        <Marker
          position={center}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragstart: () => {
              suppressClickRef.current = true;
            },
            dragend: (event) => {
              const next = event.target.getLatLng();
              onPinMove(next.lat, next.lng);
              window.setTimeout(() => {
                suppressClickRef.current = false;
              }, 80);
            },
          }}
        />

        {showRadius ? (
          <>
            <Circle
              center={center}
              radius={meters}
              pathOptions={{
                color: "#1877F2",
                fillColor: "#1877F2",
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
            {onRadiusChange ? (
              <RadiusResizeHandle
                center={center}
                meters={meters}
                radiusUnit={radiusUnit}
                suppressClickRef={suppressClickRef}
                onRadiusChange={onRadiusChange}
              />
            ) : null}
          </>
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow">
        {showRadius
          ? "Drag white handle to resize · drag pin to move center"
          : "Pan freely · click map to place the pin"}
      </div>
    </div>
  );
}
