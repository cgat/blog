import {
  MEDIA_LAYOUTS,
  MEDIA_LAYOUT_INFO,
  type MediaLayout,
} from "@/lib/media-layout";

// Thumbnail-sized sketches of each arrangement.
const glyphs: Record<MediaLayout, React.ReactNode> = {
  auto: (
    <>
      <rect x="0" y="0" width="24" height="10" />
      <rect x="0" y="12" width="5" height="6" />
      <rect x="6.3" y="12" width="5" height="6" />
      <rect x="12.6" y="12" width="5" height="6" />
      <rect x="19" y="12" width="5" height="6" />
    </>
  ),
  showcase: (
    <>
      <rect x="0" y="0" width="24" height="10" />
      <rect x="0" y="12" width="14" height="6" />
      <rect x="16" y="12" width="8" height="6" />
    </>
  ),
  masonry: (
    <>
      <rect x="0" y="0" width="7" height="10" />
      <rect x="0" y="12" width="7" height="6" />
      <rect x="8.5" y="0" width="7" height="6" />
      <rect x="8.5" y="8" width="7" height="10" />
      <rect x="17" y="0" width="7" height="12" />
      <rect x="17" y="14" width="7" height="4" />
    </>
  ),
  filmstrip: (
    <>
      <rect x="0" y="0" width="24" height="1.5" />
      <rect x="0" y="16.5" width="24" height="1.5" />
      <rect x="0" y="4" width="5" height="10" />
      <rect x="7" y="4" width="10" height="10" />
      <rect x="19" y="4" width="5" height="10" />
    </>
  ),
  slides: (
    <>
      <rect x="2" y="0" width="20" height="13" />
      <circle cx="8.5" cy="16.5" r="1.3" />
      <circle cx="12" cy="16.5" r="1.3" />
      <circle cx="15.5" cy="16.5" r="1.3" />
    </>
  ),
  stack: (
    <>
      <rect x="6" y="2" width="12" height="14" opacity="0.4" transform="rotate(-10 12 9)" />
      <rect x="6" y="2" width="12" height="14" transform="rotate(6 12 9)" />
    </>
  ),
};

interface MediaLayoutPickerProps {
  value: MediaLayout;
  onChange: (layout: MediaLayout) => void;
}

export function MediaLayoutPicker({ value, onChange }: MediaLayoutPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Media layout"
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className="mr-1 zissou-mono text-xs uppercase text-inkstain/60">
        Layout
      </span>
      {MEDIA_LAYOUTS.map((layout) => {
        const selected = layout === value;
        const { label, description } = MEDIA_LAYOUT_INFO[layout];
        return (
          <button
            key={layout}
            type="button"
            role="radio"
            aria-checked={selected}
            title={description}
            onClick={() => onChange(layout)}
            className={`flex items-center gap-1.5 border-2 px-2 py-1 zissou-mono text-xs uppercase transition-none cursor-pointer ${
              selected
                ? "border-inkstain bg-inkstain text-cream"
                : "border-transparent text-inkstain/60 hover:border-inkstain hover:text-inkstain"
            }`}
          >
            <svg viewBox="0 0 24 18" className="h-3.5 w-[18px]" fill="currentColor" aria-hidden>
              {glyphs[layout]}
            </svg>
            {label}
          </button>
        );
      })}
    </div>
  );
}
