import { ImageResponse } from "next/og";

export function createDealioOgImage(size: { width: number; height: number }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #05070D 0%, #0B1220 48%, #12203A 100%)",
          color: "#F8FAFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "#1877F2",
            }}
          />
          Dealioo
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 920 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
            }}
          >
            Turn every ad click into a repeat customer.
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: "#CBD5E1",
              maxWidth: 820,
            }}
          >
            AI deal funnels, Meta & Google Ads, payments, QR passes, and
            automation — built for local businesses.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#94A3B8",
          }}
        >
          <span>dealioo.io</span>
          <span style={{ color: "#E1306C", fontWeight: 600 }}>
            AI Growth Platform
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
