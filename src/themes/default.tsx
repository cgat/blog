"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import type { Theme } from "./types";

function DefaultBranding() {
  const theme = useTheme();

  return (
    <div className="flex flex-row items-start gap-1">
      <a href="/">
        <img
          src={theme.logo}
          alt={theme.siteName.join(" ")}
          width="56px"
          height="56px"
          className="shrink-0 w-[2.6rem]"
        />
      </a>
      <a href="/">
        <h2 className="zissou-heading text-[1.37rem] text-brand font-black text-shadow-[2px_2px_0px_var(--color-brand-accent)] tracking-[0.2px]! leading-[1.1]! flex flex-col">
          <span>{theme.siteName[0]}</span>
          <span className="inline-block text-[1rem]">{theme.siteName[1]}</span>
        </h2>
      </a>
    </div>
  );
}

export const defaultTheme: Theme = {
  id: "default",
  siteName: ["The Archive", "of Small Things"],
  logo: "/filing_cabinet2.svg",
  Branding: DefaultBranding,
};
