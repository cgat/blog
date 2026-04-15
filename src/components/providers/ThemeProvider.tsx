"use client";

import { createContext, useContext, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Theme, ThemeColors, getThemeForRoute, defaultTheme } from "@/themes";

const ThemeContext = createContext<Theme>(defaultTheme);

export function useTheme() {
  return useContext(ThemeContext);
}

function buildCssOverrides(colors?: ThemeColors): React.CSSProperties {
  if (!colors) return {};
  const vars: Record<string, string> = {};
  if (colors.brand) vars["--brand"] = colors.brand;
  if (colors.brandAccent) vars["--brand-accent"] = colors.brandAccent;
  if (colors.bgPage) vars["--bg-page"] = colors.bgPage;
  if (colors.bgPost) vars["--bg-post"] = colors.bgPost;
  if (colors.bgNavCard) vars["--bg-nav-card"] = colors.bgNavCard;
  return vars as React.CSSProperties;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const pathname = usePathname();
  const theme = getThemeForRoute(pathname);
  const styleOverrides = buildCssOverrides(theme.colors);

  return (
    <ThemeContext value={theme}>
      <div style={styleOverrides} className="contents">
        {children}
      </div>
    </ThemeContext>
  );
}
