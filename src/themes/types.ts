import { ComponentType } from "react";

export interface ThemeColors {
  brand?: string;
  brandAccent?: string;
  bgPage?: string;
  bgPost?: string;
  bgNavCard?: string;
}

export interface Theme {
  id: string;
  siteName: [string, string];
  logo: string;
  Branding: ComponentType;
  BackgroundDecoration?: ComponentType;
  colors?: ThemeColors;
}
