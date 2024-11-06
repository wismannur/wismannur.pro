import { env } from "@/constants/env";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const config = {
  runtime: "experimental-edge",
};

let fontData: any;

async function fetchFont() {
  const resMedium = await fetch(
    new URL("fonts/Inter-Medium.ttf", env.baseUrl)
  ).then((res) => res.arrayBuffer());
  const resBold = await fetch(
    new URL("fonts/Inter-Bold.ttf", env.baseUrl)
  ).then((res) => res.arrayBuffer());
  return {
    medium: resMedium,
    bold: resBold,
  };
}

export async function GET(request: NextRequest) {
  if (!fontData) fontData = await fetchFont();

  const { searchParams } = new URL(request.url);
  const title =
    searchParams.get("title") || "Wisman Nur - https://wismannur.pro";
  const description =
    searchParams.get("description") ||
    `Hi, I'm Wisman — a Frontend Web Developer focused on modern design,
          clean code, and seamless user experiences.`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(to bottom right, #111827, #374151)",
          fontFamily: "Inter",
        }}
      >
        <img
          src="https://wismannur.pro/wismannur-logo.svg"
          width={500}
          height={250}
          alt="Wisman Nur Logo"
          style={{
            marginTop: "-35px",
          }}
        />
        <h1
          style={{
            fontSize: "55px",
            fontWeight: "900",
            color: "#0EA5E9",
            marginTop: "-20px",
            marginBottom: "30px",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "30px",
            color: "#FFFFFF",
            textAlign: "center",
            fontWeight: "500",
            maxWidth: "900px",
          }}
        >
          {description}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontData.medium,
          weight: 500,
        },
        {
          name: "Inter",
          data: fontData.bold,
          weight: 900,
        },
      ],
    }
  );
}
