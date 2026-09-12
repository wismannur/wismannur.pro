import { ImageResponse } from "next/og";

import { getCachedSiteSettings } from "@/lib/site-metadata";

export const alt = "Wisman Nur - Senior Fullstack & Autonomous AI Systems Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const settings = await getCachedSiteSettings();

  const title = settings.ogTitle || "Senior Fullstack & Autonomous AI Systems Engineer";
  const tagline =
    settings.ogTagline ||
    "Architecting high-throughput web platforms, agentic AI systems, and zero-latency digital experiences.";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "50px 60px",
        backgroundColor: "#08090C",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
      }}
    >
      {/* Background Ambient Glows */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-80px",
          width: "550px",
          height: "550px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "-60px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Main Frosted Card Container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "rgba(12, 14, 24, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "28px",
          padding: "44px 50px",
          position: "relative",
        }}
      >
        {/* Top Bar: Identity & Live Availability Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Monogram Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "rgba(99, 102, 241, 0.2)",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                color: "#818CF8",
                fontSize: "20px",
                fontWeight: 900,
              }}
            >
              ⚡
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                }}
              >
                WISMAN NUR
              </span>
              <span
                style={{
                  color: "#818CF8",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
              >
                wismannur.pro
              </span>
            </div>
          </div>

          {/* Availability Status Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
              }}
            />
            <span
              style={{
                color: "#34D399",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              AVAILABLE FOR HIRE · REMOTE
            </span>
          </div>
        </div>

        {/* Center Main Headline & Value Prop */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginTop: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "52px",
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              maxWidth: "980px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "#94A3B8",
              lineHeight: 1.5,
              maxWidth: "920px",
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Bottom Tech Stack & Telemetry Strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "20px",
            width: "100%",
          }}
        >
          {/* Tech Badges */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {[
              "Next.js 16",
              "React 19",
              "Strict TypeScript",
              "Gemini & AI Agents",
              "Neon PostgreSQL",
            ].map((tech) => (
              <div
                key={tech}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#E2E8F0",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {tech}
              </div>
            ))}
          </div>

          {/* Performance Telemetry */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#818CF8",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            <span>7+ Yrs Experience · Sub-75ms Edge</span>
          </div>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
