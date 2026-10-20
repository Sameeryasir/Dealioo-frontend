"use client";

import { memo, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

const GEO_URL = "/geo/countries-110m.json";

export type RegionMarker = {
  region: string;
  count: number;
  coordinates: [number, number];
  color: string;
};

function BusinessesByRegionMapInner({
  markers,
}: {
  markers: RegionMarker[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const max = useMemo(
    () => Math.max(...markers.map((marker) => marker.count), 1),
    [markers],
  );

  return (
    <div className="relative h-full min-h-[11rem] w-full overflow-hidden rounded-2xl bg-[#f7f9fc] sm:min-h-[12.5rem]">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{
          scale: 255,
          center: [8, 12],
        }}
        width={900}
        height={380}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#d7e3f2"
                stroke="#ffffff"
                strokeWidth={0.55}
                style={{ outline: "none" }}
              />
            ))
          }
        </Geographies>

        {markers.map((marker) => {
          const radius = 3.4 + Math.min(4.2, (marker.count / max) * 4.2);
          const isHovered = hovered === marker.region;
          return (
            <Marker
              key={marker.region}
              coordinates={marker.coordinates}
              onMouseEnter={() => setHovered(marker.region)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                r={radius + 3.5}
                fill={marker.color}
                opacity={0.18}
                style={{ pointerEvents: "none" }}
              />
              <circle
                r={radius}
                fill={marker.color}
                stroke="#ffffff"
                strokeWidth={1.4}
                style={{ cursor: "default" }}
              />
              {isHovered ? (
                <g transform={`translate(0, ${-(radius + 14)})`}>
                  <rect
                    x={-46}
                    y={-16}
                    width={92}
                    height={22}
                    rx={6}
                    fill="#0f172a"
                  />
                  <text
                    textAnchor="middle"
                    y={-1}
                    style={{
                      fontFamily: "inherit",
                      fontSize: 9,
                      fontWeight: 700,
                      fill: "#ffffff",
                    }}
                  >
                    {marker.region} · {marker.count}
                  </text>
                </g>
              ) : null}
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}

export const BusinessesByRegionMap = memo(BusinessesByRegionMapInner);
