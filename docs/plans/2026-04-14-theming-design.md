# Site Theming Design

## Goal

Make the site themeable so specific routes (like `/thelittlepicture`) can have their own visual identity — different logo, site name, branding component, and color palette — while most routes use the default theme. No UI needed; themes are defined in code.

## Themeable Surfaces

Only these surfaces change per theme:

- **Page background** (`bg-cream` → `bg-page`)
- **Post card background** (`bg-[white]` → `bg-post`)
- **Nav card background** (`bg-[white]` → `bg-nav-card`)
- **Brand color** (`text-tracksuit-red` → `text-brand`) — header text, accents
- **Brand accent** (`var(--submarine-yellow)` → `var(--color-brand-accent)`) — text shadows, hover tints
- **Header/branding component** — logo SVG, site name, typography proportions

Everything else (button states, share menu, deep component internals) stays hardcoded.

## Theme Config Shape

```ts
// src/themes/types.ts
export interface Theme {
  id: string;
  siteName: [string, string];        // two lines for header
  logo: string;                       // path to SVG in /public
  Branding: React.ComponentType;      // custom branding component
  colors?: {
    brand?: string;
    brandAccent?: string;
    bgPage?: string;
    bgPost?: string;
    bgNavCard?: string;
  };
}
```

Partial color overrides — only specify what differs from defaults.

## Route-to-Theme Mapping

Central registry in `src/themes/index.ts`:

```ts
import { defaultTheme } from './default';
import { littlePictureTheme } from './the-little-picture';

const routeThemes: Record<string, Theme> = {
  "/thelittlepicture": littlePictureTheme,
};

export function getThemeForRoute(pathname: string): Theme {
  return routeThemes[pathname] ?? defaultTheme;
}
```

## How Themes Are Applied

### 1. Semantic CSS Variables

Added to `globals.css` in `:root`, pointing to existing color vars:

```css
--color-brand: var(--tracksuit-red);
--color-brand-accent: var(--submarine-yellow);
--color-bg-page: var(--cream);
--color-bg-post: white;
--color-bg-nav-card: white;
```

Registered in `@theme inline` so Tailwind generates `text-brand`, `bg-page`, `bg-post`, `bg-nav-card`.

### 2. ThemeProvider

Client component that reads the pathname, looks up the theme, and:

1. Sets CSS variable overrides via inline `style` on a wrapper div
2. Provides the theme object via React context (for `Branding` component access)

```tsx
export function ThemeProvider({ children }) {
  const pathname = usePathname();
  const theme = getThemeForRoute(pathname);
  const styleOverrides = buildCssOverrides(theme.colors);

  return (
    <ThemeContext value={theme}>
      <div style={styleOverrides}>{children}</div>
    </ThemeContext>
  );
}
```

### 3. Component Migration

Sidebar and Header swap their hardcoded branding markup for `<theme.Branding />` from context. Class name changes:

| Before | After | Where |
|--------|-------|-------|
| `bg-cream` | `bg-page` | AppLayout |
| `bg-[white]` on posts | `bg-post` | PostCard |
| `bg-[white]` on nav | `bg-nav-card` | NavCards |
| `text-tracksuit-red` | `text-brand` | Sidebar/Header branding |
| `var(--submarine-yellow)` in text-shadow | `var(--color-brand-accent)` | Branding components |

## Default Theme

Pure extraction of current hardcoded values — zero visual change:

```ts
export const defaultTheme: Theme = {
  id: "default",
  siteName: ["The Archive", "of Small Things"],
  logo: "/filing_cabinet2.svg",
  Branding: DefaultBranding,
};
```

`DefaultBranding` renders the filing cabinet + two-line title using `text-brand` and `--color-brand-accent`.

## The Little Picture Theme

```ts
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
```

Camera logo: blocky, geometric, Wes Anderson style. Flat blue tones. Branding component with proportions suited to the camera SVG.

## Implementation Steps

1. Add semantic CSS variables to `globals.css` + `@theme inline`
2. Create `src/themes/types.ts` with Theme interface
3. Create `src/themes/default.tsx` — extract current branding into DefaultBranding component
4. Create `src/themes/index.ts` — registry + `getThemeForRoute`
5. Create `ThemeProvider` with context + CSS var overrides
6. Wire ThemeProvider into `layout.tsx`
7. Update Sidebar/Header to use `<theme.Branding />` from context
8. Migrate class names on themeable surfaces (AppLayout, PostCard, NavCards)
9. Create `/public/little-picture-logo.svg`
10. Create `src/themes/the-little-picture.tsx`
11. Verify default theme has zero visual change
12. Verify `/thelittlepicture` shows blue theme
