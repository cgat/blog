"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import type { Theme } from "./types";

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
        <h2 className="zissou-heading text-[1.5rem] text-brand font-black text-shadow-[2px_2px_0px_var(--color-brand-accent)] tracking-[0.2px]! leading-[1.1]! flex flex-col">
          <span>{theme.siteName[0]}</span>
          <span className="inline-block text-[1.1rem]">{theme.siteName[1]}</span>
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
  colors: {
    brand: "#2c5f8a",
    brandAccent: "#a8c8e8",
    bgPage: "#e8f0f8",
    bgPost: "#f5f9fc",
    bgNavCard: "#f5f9fc",
  },
};
