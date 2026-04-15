# Theming System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the site themeable per route — different logo, site name, branding component, and color palette — starting with a "The Little Picture" blue theme for `/thelittlepicture`.

**Architecture:** Semantic CSS variables for colors, React context for theme data (branding component, logo, site name). Themes defined as TypeScript files in `src/themes/`. Central route-to-theme registry. ThemeProvider reads pathname, sets CSS overrides + context.

**Tech Stack:** Tailwind CSS 4 `@theme inline`, React context, CSS custom properties

**Design doc:** `docs/plans/2026-04-14-theming-design.md`

---

### Task 1: Add Semantic CSS Variables

**Files:**
- Modify: `src/app/globals.css:5-27`

**Step 1: Add semantic variables to `:root`**

In `src/app/globals.css`, add these lines after the existing color variables (after line 11, before the closing `}`):

```css
  /* Semantic theme tokens */
  --color-brand: var(--tracksuit-red);
  --color-brand-accent: var(--submarine-yellow);
  --color-bg-page: var(--cream);
  --color-bg-post: white;
  --color-bg-nav-card: white;
```

**Step 2: Register semantic tokens in `@theme inline`**

Add after the existing color entries (after line 21):

```css
  /* Semantic theme colors */
  --color-brand: var(--color-brand);
  --color-brand-accent: var(--color-brand-accent);
  --color-bg-page: var(--color-bg-page);
  --color-bg-post: var(--color-bg-post);
  --color-bg-nav-card: var(--color-bg-nav-card);
```

Note: In Tailwind CSS 4 `@theme inline`, the `--color-*` keys map to Tailwind class names. `--color-brand` produces `text-brand`, `bg-brand`, etc. The value references the `:root` custom property of the same name.

**Step 3: Verify dev server compiles without errors**

Run: `npm run dev` — check the terminal for CSS compilation errors. Visit `http://localhost:3000` and confirm the site looks identical (no visual change).

**Step 4: Commit**

```
feat(theme): add semantic CSS variables for themeable surfaces
```

---

### Task 2: Create Theme Types and Registry

**Files:**
- Create: `src/themes/types.ts`
- Create: `src/themes/index.ts`

**Step 1: Create `src/themes/types.ts`**

```ts
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
  colors?: ThemeColors;
}
```

**Step 2: Create `src/themes/index.ts`**

Stub with just the default theme for now (we'll create `default.tsx` in the next task):

```ts
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
```

**Step 3: Commit**

```
feat(theme): add Theme type and route-to-theme registry
```

---

### Task 3: Create Default Theme with Branding Component

**Files:**
- Create: `src/themes/default.tsx`

**Step 1: Create `src/themes/default.tsx`**

Extract the branding markup currently in `Sidebar.tsx:66-83` and `Header.tsx:33-44` into a reusable component. This component uses the semantic `text-brand` and `--color-brand-accent` classes instead of hardcoded colors.

```tsx
"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Theme } from "./types";

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
```

Note: This file references `useTheme` from `ThemeProvider` which doesn't exist yet — that's the next task. This won't compile until Task 4 is done, but we commit after Task 4.

---

### Task 4: Create ThemeProvider

**Files:**
- Create: `src/components/providers/ThemeProvider.tsx`
- Modify: `src/app/layout.tsx:27-44`

**Step 1: Create `src/components/providers/ThemeProvider.tsx`**

```tsx
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
  if (colors.brand) vars["--color-brand"] = colors.brand;
  if (colors.brandAccent) vars["--color-brand-accent"] = colors.brandAccent;
  if (colors.bgPage) vars["--color-bg-page"] = colors.bgPage;
  if (colors.bgPost) vars["--color-bg-post"] = colors.bgPost;
  if (colors.bgNavCard) vars["--color-bg-nav-card"] = colors.bgNavCard;
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
```

Note: `className="contents"` makes the wrapper div invisible to layout — it only exists to apply CSS variable overrides.

**Step 2: Wire ThemeProvider into `src/app/layout.tsx`**

Add import at top:

```ts
import { ThemeProvider } from "@/components/providers/ThemeProvider";
```

Wrap inside `<SessionProvider>`:

```tsx
<SessionProvider>
  <ThemeProvider>{children}</ThemeProvider>
</SessionProvider>
```

**Step 3: Verify dev server compiles and site looks identical**

Run: `npm run dev` — visit `http://localhost:3000`. Everything should look exactly the same as before.

**Step 4: Commit**

```
feat(theme): add ThemeProvider with context and CSS variable overrides
```

---

### Task 5: Update Sidebar to Use Theme Branding

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Step 1: Replace hardcoded branding with theme component**

In `Sidebar.tsx`, add import:

```ts
import { useTheme } from "@/components/providers/ThemeProvider";
```

Inside the component function, add:

```ts
const theme = useTheme();
const Branding = theme.Branding;
```

Replace the entire logo + branding section (lines 66-83, the `<div className="flex flex-row items-start gap-1">` block) with:

```tsx
{minimized ? (
  <a href="/">
    <img
      src={theme.logo}
      alt={theme.siteName.join(" ")}
      width="56px"
      height="56px"
      className="shrink-0 w-[2.6rem]"
    />
  </a>
) : (
  <Branding />
)}
```

**Step 2: Verify sidebar looks identical on desktop**

Check both full sidebar and minimized (with a panel open) states.

**Step 3: Commit**

```
feat(theme): use theme branding component in Sidebar
```

---

### Task 6: Update Header to Use Theme Branding

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Step 1: Replace hardcoded branding with theme component**

In `Header.tsx`, add import:

```ts
import { useTheme } from "@/components/providers/ThemeProvider";
```

Inside the component function, add:

```ts
const theme = useTheme();
const Branding = theme.Branding;
```

Replace the branding `<a>` block (lines 33-44, the `<a href="/" className="flex flex-row">` through the closing `</a>`) with:

```tsx
<Branding />
```

**Step 2: Verify mobile header looks identical**

Resize browser to mobile width, confirm the header renders correctly.

**Step 3: Commit**

```
feat(theme): use theme branding component in Header
```

---

### Task 7: Migrate Themeable Surface Class Names

**Files:**
- Modify: `src/components/layout/AppLayout.tsx:52`
- Modify: `src/components/composites/PostCard.tsx:180,195`
- Modify: `src/components/composites/NavCards.tsx:38,63`
- Modify: `src/components/layout/Header.tsx:31`

**Step 1: Migrate AppLayout page background**

In `src/components/layout/AppLayout.tsx` line 52, change:
- `bg-cream` → `bg-page`

**Step 2: Migrate PostCard backgrounds**

In `src/components/composites/PostCard.tsx`, change both article elements (lines 180 and 195):
- `bg-[white]` → `bg-post`

**Step 3: Migrate NavCards backgrounds**

In `src/components/composites/NavCards.tsx`:
- Line 38: change `bg-[white]` → `bg-nav-card` in the nav item className
- Line 63: change `bg-[white]` → `bg-nav-card` in the RSS card className

**Step 4: Migrate Header background**

In `src/components/layout/Header.tsx` line 31, change:
- `bg-[white]` → `bg-nav-card`

The header background should match nav cards since it's part of the same navigation chrome.

**Step 5: Verify everything looks identical**

Visit `http://localhost:3000`, check desktop and mobile. All backgrounds should be unchanged since the semantic variables default to the same values.

**Step 6: Commit**

```
feat(theme): migrate themeable surfaces to semantic CSS classes
```

---

### Task 8: Create The Little Picture Camera Logo

**Files:**
- Create: `public/little-picture-logo.svg`

**Step 1: Create a blocky Wes Anderson-style camera SVG**

The camera should be:
- Geometric, symmetrical, flat design
- Uses the theme's blue palette (`#2c5f8a` steel blue as primary, `#a8c8e8` light sky as accent)
- Similar visual weight to the filing cabinet at `w-[2.6rem]`
- Simple shapes: rectangles for body, circle for lens, small rectangle for viewfinder

Save to `public/little-picture-logo.svg`.

**Step 2: Verify the SVG renders**

Open `http://localhost:3000/little-picture-logo.svg` in the browser to confirm it loads.

**Step 3: Commit**

```
feat(theme): add blocky camera logo for The Little Picture theme
```

---

### Task 9: Create The Little Picture Theme

**Files:**
- Create: `src/themes/the-little-picture.tsx`
- Modify: `src/themes/index.ts`

**Step 1: Create `src/themes/the-little-picture.tsx`**

```tsx
"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Theme } from "./types";

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
```

Note: The branding links to `/thelittlepicture` instead of `/` — keeps users in The Little Picture context. Font sizes are slightly larger (`1.5rem` / `1.1rem`) and logo width is `3rem` to suit the camera proportions. Adjust as needed after visual review.

**Step 2: Register in `src/themes/index.ts`**

Add import:

```ts
import { littlePictureTheme } from "./the-little-picture";
```

Add to routeThemes:

```ts
const routeThemes: Record<string, Theme> = {
  "/thelittlepicture": littlePictureTheme,
};
```

**Step 3: Verify The Little Picture theme**

Visit `http://localhost:3000/thelittlepicture`. Confirm:
- Page background is pale blue-grey (`#e8f0f8`)
- Post cards are near-white blue (`#f5f9fc`)
- Nav cards are near-white blue
- Header/sidebar branding shows "The Little Picture" with camera logo in steel blue
- Text shadow on site name is light sky blue

**Step 4: Verify default theme unchanged**

Visit `http://localhost:3000`. Confirm everything looks exactly as before — red branding, cream background, filing cabinet logo.

**Step 5: Commit**

```
feat(theme): add The Little Picture blue theme for /thelittlepicture
```

---

### Task 10: Final Verification and TODO Update

**Files:**
- Modify: `TODO.md`

**Step 1: Full verification**

Test both themes across desktop and mobile:
- `http://localhost:3000` — default theme, full sidebar, minimized sidebar
- `http://localhost:3000` on mobile width — default header, nav tray
- `http://localhost:3000/thelittlepicture` — blue theme sidebar and content
- `http://localhost:3000/thelittlepicture` on mobile — blue theme header and content
- Navigate between `/` and `/thelittlepicture` — theme should swap cleanly

**Step 2: Update TODO.md**

Mark the theming tasks as complete:
- `[x] Make the site themeable...`
- `[x] Once the themability is in place, create a theme for "The Little Picture"...`

**Step 3: Commit**

```
chore: mark theming tasks complete in TODO
```
