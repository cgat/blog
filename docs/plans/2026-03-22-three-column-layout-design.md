# Three-Column Layout Design

## Goal

Replace the current single-column centered layout with a 3-column grid on desktop: sticky sidebar nav, main content, and a supporting panel that appears on demand (e.g., image viewer). When the panel is engaged, the nav minimizes to logo-only and the content shifts left to make room.

## Layout States

### Default (no panel)

```
┌──────────┬─────────────────────┐
│          │                     │
│   NAV    │     CONTENT         │
│  sticky  │   max-w-4xl         │
│  ~250px  │   centered          │
│          │                     │
└──────────┴─────────────────────┘
```

Grid: `250px 1fr`

Content has an inner max-width and centers within its `1fr` column.

### Panel engaged

```
┌────┬──────────────┬─────────────┐
│LOGO│   CONTENT    │   PANEL     │
│ 64 │  shifts left  │  fills rest │
│    │  max-w still  │  max-w-1000 │
│    │  applies      │  sticky     │
└────┴──────────────┴─────────────┘
```

Grid: `64px 56rem 1fr`

Nav collapses to 64px (logo only). Content keeps its max-width but left-aligned. Panel fills remaining space, capped at 1000px.

### Mobile

No grid. Sticky header on top (same as today). Single column. Panel opens as a modal overlay.

## Transition

Grid column sizes animate via `transition: grid-template-columns 300ms ease-in-out`. When panel opens, the three changes happen in one coordinated motion: nav shrinks, content shifts left, panel appears.

## Components

### New: `AppLayout`

Top-level layout shell in `src/components/layout/AppLayout.tsx`.

Props:
- `children` — main content
- `panel` — React node for the right panel (or null)

Desktop: renders the CSS grid with `Sidebar` + children + panel slot.
Mobile: renders `Header` (sticky top bar) + children. If panel is truthy, renders it as a fixed modal overlay.

### New: `Sidebar`

`src/components/layout/Sidebar.tsx`

Extracted from `Header`. Contains logo, "The Archive of Small Things" title, auth controls.

Props:
- `minimized` — boolean, when true shows only the logo icon centered in 64px column

Sticky, full viewport height. When minimized, title is hidden, auth dropdown still accessible via logo/avatar click.

### Modified: `Header`

Becomes mobile-only. Used by `AppLayout` on small screens. No changes to its internal structure.

### Modified: `FeedPage`

Uses `AppLayout` instead of directly rendering `Header` + `<main>`. Passes the `ImageViewer` as the `panel` prop when an image is selected.

### Modified: `FeedLayout`

Reverts to a simple list of PostCards. No per-row grid, no viewer rendering. The viewer lives in AppLayout's panel slot.

### `ImageViewer`

No structural changes needed. The desktop wrapper (`max-md:hidden` div) can be removed since AppLayout handles desktop vs mobile rendering. The mobile modal wrapper stays for when AppLayout renders it as a modal.

## State Flow

1. User clicks image in ImageGrid
2. ImageGrid calls `onImageClick(image)`
3. PostCard passes to FeedLayout, FeedLayout passes to FeedPage
4. FeedPage sets `viewerImage` and `viewerPostId`
5. FeedPage passes `<ImageViewer>` as `panel` prop to AppLayout
6. AppLayout switches grid to 3-column mode
7. Sidebar receives `minimized={true}` and collapses
8. Panel appears with image + caption

Closing: user clicks close in ImageViewer, FeedPage clears state, panel prop becomes null, grid reverts to 2-column.

## Implementation Order

1. Create `Sidebar` — extract from Header
2. Create `AppLayout` — the grid shell
3. Update `FeedPage` — use AppLayout, pass panel
4. Simplify `FeedLayout` — remove viewer rendering
5. Clean up `ImageViewer` — remove redundant responsive wrappers
6. Update `Header` — mobile-only
