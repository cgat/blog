// How a post's photos and videos are arranged in the feed. Chosen per post in
// the Composer (or via the API / MCP server) and stored in posts.media_layout.
//
// Keep this file free of `@/` imports: the Drizzle schema imports it by
// relative path so drizzle-kit can resolve it.

export const MEDIA_LAYOUTS = [
  'auto',
  'showcase',
  'masonry',
  'filmstrip',
  'slides',
  'stack',
] as const;

export type MediaLayout = (typeof MEDIA_LAYOUTS)[number];

export const DEFAULT_MEDIA_LAYOUT: MediaLayout = 'auto';

export const MEDIA_LAYOUT_INFO: Record<MediaLayout, { label: string; description: string }> = {
  auto: {
    label: 'Auto',
    description: 'Featured photo with a grid of small thumbnails. Good for big batches.',
  },
  showcase: {
    label: 'Showcase',
    description: 'Large, uncropped photos with captions underneath. Best for 1 to 3.',
  },
  masonry: {
    label: 'Masonry',
    description: 'Uncropped photos packed into columns.',
  },
  filmstrip: {
    label: 'Filmstrip',
    description: 'A horizontal strip of frames you scroll sideways through.',
  },
  slides: {
    label: 'Slides',
    description: 'One photo at a time, swiped in place, with its caption.',
  },
  stack: {
    label: 'Stack',
    description: 'A pile of prints you flip through.',
  },
};

export function isMediaLayout(value: unknown): value is MediaLayout {
  return typeof value === 'string' && (MEDIA_LAYOUTS as readonly string[]).includes(value);
}

// Display order shared by every layout and the full-screen viewer: the featured
// item first, then the rest in their stored order.
export function orderMedia<T extends { id: string; featured?: boolean }>(items: T[]): T[] {
  const featuredIndex = items.findIndex((item) => item.featured);
  if (featuredIndex <= 0) return items;
  const featured = items[featuredIndex];
  return [featured, ...items.filter((item) => item.id !== featured.id)];
}
