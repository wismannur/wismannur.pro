import { ImageResponse } from "next/og";

import { getCachedSiteSettings } from "@/lib/site-metadata";

// Generated OG card (phase 8.5) — replaces the static image that lived on
// cdn.sundflow.cloud (host is gone; DNS no longer resolves). Name/role/
// tagline come from the CMS-managed site_settings row.

export const alt = "Wisman Nur - Frontend Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const settings = await getCachedSiteSettings();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          color: "#818cf8",
          fontSize: 28,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        wismannur.pro
      </div>
      <div style={{ display: "flex", fontSize: 84, fontWeight: 700, marginTop: 24 }}>
        {settings.siteName}
      </div>
      <div style={{ display: "flex", fontSize: 40, color: "#a5b4fc", marginTop: 12 }}>
        {settings.ogTitle}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 26,
          color: "#94a3b8",
          marginTop: 40,
          maxWidth: 900,
          lineHeight: 1.5,
        }}
      >
        {settings.ogTagline}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "12px",
          background: "linear-gradient(90deg, #4F46E5 0%, #818cf8 100%)",
          display: "flex",
        }}
      />
    </div>,
    { ...size }
  );
}
