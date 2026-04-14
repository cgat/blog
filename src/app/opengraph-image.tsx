import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-utils";

export const alt = "The Archive of Small Things";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const jostBold = await loadGoogleFont("Jost", 700);

  const textStyle = {
    fontFamily: "Jost",
    fontSize: 72,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    display: "flex" as const,
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          backgroundColor: "#ffb703",
          padding: 40,
        }}
      >
        <div
          style={{
            width: 1120,
            height: 550,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fdf5e6",
          }}
        >
          {/* "The Archive" with shadow */}
          <div style={{ display: "flex", position: "relative" }}>
            <div style={{ ...textStyle, color: "rgba(44, 44, 44, 0.12)", position: "absolute", top: 3, left: 3 }}>
              The Archive
            </div>
            <div style={{ ...textStyle, color: "#2c2c2c" }}>
              The Archive
            </div>
          </div>
          {/* "of Small Things" with shadow */}
          <div style={{ display: "flex", position: "relative" }}>
            <div style={{ ...textStyle, color: "rgba(44, 44, 44, 0.12)", position: "absolute", top: 3, left: 3 }}>
              of Small Things
            </div>
            <div style={{ ...textStyle, color: "#2c2c2c" }}>
              of Small Things
            </div>
          </div>
          <div
            style={{
              width: 120,
              height: 4,
              backgroundColor: "#4682b4",
              marginTop: 24,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Jost",
          data: jostBold,
          weight: 700 as const,
          style: "normal" as const,
        },
      ],
    },
  );
}
