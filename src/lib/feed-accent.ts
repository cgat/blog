// Static palette so Tailwind's source scan picks up these class names.
const FEED_ACCENT_PALETTE = [
  'bg-tracksuit-red',
  'bg-submarine-yellow',
  'bg-deep-ocean-teal',
  'bg-mendls-pink',
  'bg-inkstain',
] as const;

export function feedAccentClass(feedId: string): string {
  let hash = 0;
  for (let i = 0; i < feedId.length; i++) {
    hash = (hash * 31 + feedId.charCodeAt(i)) | 0;
  }
  return FEED_ACCENT_PALETTE[Math.abs(hash) % FEED_ACCENT_PALETTE.length];
}
