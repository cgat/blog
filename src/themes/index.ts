import { Theme } from "./types";
import { defaultTheme } from "./default";
import { littlePictureTheme } from "./the-little-picture";

export type { Theme, ThemeColors } from "./types";

const routeThemes: Record<string, Theme> = {
  "/thelittlepicture": littlePictureTheme,
};

export function getThemeForRoute(pathname: string): Theme {
  return routeThemes[pathname] ?? defaultTheme;
}

export { defaultTheme };
