"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import type { Theme } from "./types";

function FilmStripDecoration() {
  // Based on real 35mm film proportions:
  // Strip width: 35mm. Frame: 24x36mm (24mm tall on vertical strip).
  // Sprocket holes: ~1.98mm wide x 2.79mm tall, pitch 4.75mm, 8 per frame.
  // Borders: ~2mm on each side for sprocket area, frame centered.
  //
  // Scaled: 1mm ≈ 1.5px → strip 52px wide, frame 36x54px equivalent
  // One segment = one frame height + gap ≈ 38mm ≈ 57px (frame 24mm + gap ~14mm)
  // Using 190px segment = 2 frames stacked for clean tiling

  const w = 52; // strip width
  const frameH = 36; // frame height
  const gap = 4; // slim gap between frames
  const h = frameH + gap; // one frame + one gap = perfect tile
  const holeW = 3; // sprocket hole width
  const holeH = 4; // sprocket hole height
  const holeR = 0.8;
  const holePitch = 7; // spacing between hole centers
  const holeXL = 2; // left holes x position
  const holeXR = w - holeW - 2; // right holes x position
  const frameX = 8; // frame left edge
  const frameW = w - 16; // frame width (36px)
  const frameY = 0; // frame starts at top of tile

  // Generate sprocket holes — continuous down both sides
  const holes: string[] = [];
  for (let y = 3; y < h; y += holePitch) {
    holes.push(
      `<rect x='${holeXL}' y='${y}' width='${holeW}' height='${holeH}' rx='${holeR}' fill='%23e8f0f8'/>`,
    );
    holes.push(
      `<rect x='${holeXR}' y='${y}' width='${holeW}' height='${holeH}' rx='${holeR}' fill='%23e8f0f8'/>`,
    );
  }

  // Strip is dark. Sprocket holes are light cutouts. Thin gap between frames is light.
  // Tile = one dark frame + one light gap. Repeating gives consistent spacing.
  const gapY = frameY + frameH;
  const segment = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect width='${w}' height='${h}' fill='%231a3a5c'/>${holes.join("")}<rect x='${frameX}' y='${gapY}' width='${frameW}' height='${gap}' fill='%23e8f0f8'/></svg>`;

  return (
    <div
      className="fixed top-0 right-4 h-full pointer-events-none z-0 hidden md:block"
      style={{
        width: w,
        opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml,${segment}")`,
        backgroundRepeat: "repeat-y",
        backgroundSize: `${w}px ${h}px`,
      }}
    />
  );
}

function LittlePictureBranding() {
  const theme = useTheme();

  return (
    <div className="flex flex-row items-start gap-1.5">
      <a href="/thelittlepicture">
        <img
          src={theme.logo}
          alt={theme.siteName.join(" ")}
          width="56px"
          height="56px"
          className="shrink-0 w-[3rem]"
        />
      </a>
      <a href="/thelittlepicture">
        <h2 className="zissou-heading text-brand font-black text-shadow-[2px_2px_0px_var(--color-brand-accent)] tracking-[0.2px]! leading-[1.1]! flex flex-col">
          <span className="text-[1.34em]">{theme.siteName[0]}</span>
          <span className="inline-block text-[1.7em]">{theme.siteName[1]}</span>
        </h2>
      </a>
    </div>
  );
}

export const littlePictureTheme: Theme = {
  id: "the-little-picture",
  siteName: ["The Little", "Picture"],
  logo: "/little-picture-logo.svg",
  Branding: LittlePictureBranding,
  BackgroundDecoration: FilmStripDecoration,
  colors: {
    brand: "#2c5f8a",
    brandAccent: "#a8c8e8",
    bgPage: "#e8f0f8",
    bgPost: "#ffffff",
    bgNavCard: "#f5f9fc",
  },
};
