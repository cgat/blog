import { Theme } from "./types";
import { defaultTheme } from "./default";

export type { Theme, ThemeColors } from "./types";

const routeThemes: Record<string, Theme> = {
  // will add the-little-picture here later
};

export function getThemeForRoute(pathname: string): Theme {
  return routeThemes[pathname] ?? defaultTheme;
}

export { defaultTheme };
