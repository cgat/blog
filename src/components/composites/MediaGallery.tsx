"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ImageGrid,
  MediaThumb,
  CaptionIndicator,
  type ImageItem,
} from "./ImageGrid";
import { orderMedia, type MediaLayout } from "@/lib/media-layout";

// Every clickable frame carries `data-media-id`. The full-screen ImageViewer
// looks that element up to grow out of (and shrink back into) the thumbnail.
// Scroll containers carry `data-media-clip` so the viewer can tell when a
// thumbnail is scrolled out of sight.

interface MediaGalleryProps {
  images: ImageItem[];
  layout?: MediaLayout;
  onImageClick?: (image: ImageItem) => void;
}

interface VariantProps {
  items: ImageItem[];
  onImageClick?: (image: ImageItem) => void;
}

export function MediaGallery({
  images,
  layout = "auto",
  onImageClick,
}: MediaGalleryProps) {
  if (images.length === 0) return null;

  if (layout === "auto") {
    return <ImageGrid images={images} expanded onImageClick={onImageClick} />;
  }

  const items = orderMedia(images);
  const props = { items, onImageClick };

  // A lone photo has nothing to scroll, pack or flip through.
  if (items.length === 1) return <Showcase {...props} />;

  switch (layout) {
    case "masonry":
      return <Masonry {...props} />;
    case "filmstrip":
      return <Filmstrip {...props} />;
    case "slides":
      return <Slides {...props} />;
    case "stack":
      return <Stack {...props} />;
    default:
      return <Showcase {...props} />;
  }
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

/* ───────────────────────── Showcase ─────────────────────────
   Uncropped photos at their true proportions, captions in view.
   Rows are justified: each photo's width is proportional to its
   aspect ratio, so everything in a row shares one height. */

function ShowcaseFigure({
  item,
  inRow,
  sizes,
  onImageClick,
}: {
  item: ImageItem;
  inRow?: boolean;
  sizes: string;
  onImageClick?: (image: ImageItem) => void;
}) {
  return (
    <figure
      className="min-w-0"
      style={inRow ? { flex: `${item.width / item.height} 1 0%` } : undefined}
    >
      <div
        data-media-id={item.id}
        className="relative zissou-border overflow-hidden cursor-pointer"
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
        onClick={() => onImageClick?.(item)}
      >
        <MediaThumb
          item={item}
          alt={item.alt || item.caption || "Post image"}
          fill
          className="object-cover"
          sizes={sizes}
        />
      </div>
      {item.caption && (
        <figcaption className="mt-1.5 zissou-mono text-xs leading-snug text-inkstain/70">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

// Pairs, with a trailing single folded into the row before it.
function toRows(items: ImageItem[]): ImageItem[][] {
  const rows: ImageItem[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  const last = rows[rows.length - 1];
  if (rows.length > 1 && last.length === 1) {
    rows.pop();
    rows[rows.length - 1].push(last[0]);
  }
  return rows;
}

function Showcase({ items, onImageClick }: VariantProps) {
  const [hero, ...rest] = items;
  const heroIsPortrait = hero.height > hero.width;

  // A full-width portrait is taller than the screen, so a portrait lead shares
  // its row instead of standing alone.
  const heroAlone = items.length === 1 || (items.length >= 3 && !heroIsPortrait);
  const rows = heroAlone ? toRows(rest) : toRows(items);

  return (
    <div className="flex flex-col gap-1">
      {heroAlone && (
        <ShowcaseFigure
          item={hero}
          sizes="(max-width: 768px) 92vw, 720px"
          onImageClick={onImageClick}
        />
      )}
      {rows.map((row) => (
        <div key={row[0].id} className="flex items-start gap-1">
          {row.map((item) => (
            <ShowcaseFigure
              key={item.id}
              item={item}
              inRow
              sizes="(max-width: 768px) 60vw, 480px"
              onImageClick={onImageClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Masonry ───────────────────────── */

function Masonry({ items, onImageClick }: VariantProps) {
  const columns = items.length <= 4 ? "columns-2" : "columns-2 sm:columns-3";
  return (
    <div className={`${columns} gap-1`}>
      {items.map((item, index) => (
        <div
          key={item.id}
          data-media-id={item.id}
          className="relative mb-1 break-inside-avoid zissou-border overflow-hidden cursor-pointer"
          onClick={() => onImageClick?.(item)}
        >
          <MediaThumb
            item={item}
            alt={item.alt || `Image ${index + 1}`}
            className="block h-auto w-full"
            sizes="(max-width: 768px) 46vw, 260px"
          />
          {item.caption && <CaptionIndicator />}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Filmstrip ─────────────────────────
   Native horizontal scrolling with scroll-snap, so touch, trackpad
   and momentum all behave the way the platform does. */

const SPROCKETS =
  "repeating-linear-gradient(90deg, var(--cream) 0 9px, transparent 9px 20px)";

function Filmstrip({ items, onImageClick }: VariantProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const prev = el.scrollLeft > 4;
    const next = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdges((current) =>
      current.prev === prev && current.next === next ? current : { prev, next },
    );
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges, items.length]);

  const nudge = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative zissou-border bg-inkstain">
      <div
        ref={scrollerRef}
        data-media-clip
        onScroll={updateEdges}
        className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-none"
      >
        <div
          className="flex w-max gap-1.5 px-1.5 py-5"
          style={{
            backgroundImage: `${SPROCKETS}, ${SPROCKETS}`,
            backgroundSize: "100% 6px, 100% 6px",
            backgroundPosition: "0 7px, 0 calc(100% - 7px)",
            backgroundRepeat: "no-repeat",
          }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              data-media-id={item.id}
              className="relative h-[clamp(200px,48vw,360px)] max-w-[80vw] shrink-0 snap-center overflow-hidden cursor-pointer"
              style={{ aspectRatio: `${item.width} / ${item.height}` }}
              onClick={() => onImageClick?.(item)}
            >
              <MediaThumb
                item={item}
                alt={item.alt || `Frame ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80vw, 540px"
              />
              {item.caption && <CaptionIndicator />}
            </div>
          ))}
        </div>
      </div>

      {(["left", "right"] as const).map((side) => (
        <button
          key={side}
          type="button"
          onClick={() => nudge(side === "left" ? -1 : 1)}
          disabled={side === "left" ? !edges.prev : !edges.next}
          aria-label={side === "left" ? "Scroll back" : "Scroll forward"}
          className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-inkstain zissou-border opacity-80 transition-opacity hover:opacity-100 disabled:pointer-events-none disabled:opacity-0 cursor-pointer sm:flex ${
            side === "left" ? "left-2" : "right-2"
          }`}
        >
          <Chevron direction={side} />
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Slides ─────────────────────────
   One at a time, swiped in place. The stage takes the lead photo's
   proportions (within reason); other shapes are letterboxed. */

function Slides({ items, onImageClick }: VariantProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "center" });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const lead = items[0];
  const stageRatio = Math.min(16 / 9, Math.max(4 / 5, lead.width / lead.height));
  const current = items[Math.min(index, items.length - 1)];

  return (
    <div className="zissou-border">
      <div
        ref={emblaRef}
        data-media-clip
        className="overflow-hidden bg-inkstain"
        style={{ aspectRatio: stageRatio }}
      >
        <div className="flex h-full touch-pan-y">
          {items.map((item, i) => {
            const fillsWidth = item.width / item.height >= stageRatio;
            return (
              <div
                key={item.id}
                className="flex h-full min-w-0 shrink-0 grow-0 basis-full items-center justify-center cursor-pointer"
                aria-hidden={i !== index}
                // Embla swallows the click that ends a drag, so this only
                // fires for a genuine tap.
                onClick={() => onImageClick?.(item)}
              >
                <div
                  data-media-id={item.id}
                  className={`relative ${fillsWidth ? "w-full" : "h-full"}`}
                  style={{ aspectRatio: `${item.width} / ${item.height}` }}
                >
                  <MediaThumb
                    item={item}
                    alt={item.alt || item.caption || `Slide ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 92vw, 720px"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-inkstain bg-cream px-3 py-1.5 text-inkstain">
        <span className="zissou-mono text-xs tracking-widest">
          {pad2(index + 1)} / {pad2(items.length)}
        </span>

        {items.length <= 12 && (
          <div className="flex items-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2 w-2 rounded-full border border-inkstain cursor-pointer ${
                  i === index ? "bg-tracksuit-red" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={index === 0}
            aria-label="Previous slide"
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-submarine-yellow/40 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={index === items.length - 1}
            aria-label="Next slide"
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-submarine-yellow/40 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
          >
            <Chevron direction="right" />
          </button>
        </div>
      </div>

      {current.caption && (
        <p className="border-t-2 border-inkstain bg-cream px-3 py-2 font-serif text-sm italic leading-snug text-inkstain">
          {current.caption}
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── Stack ─────────────────────────
   A pile of prints. The top one opens the viewer; the arrows (or a
   tap on the pile underneath) slide the top print off and tuck it
   under the rest. */

const FLING_MS = 240;
const VISIBLE_DEPTH = 3;

function Stack({ items, onImageClick }: VariantProps) {
  const count = items.length;
  const [top, setTop] = useState(0);
  const [fling, setFling] = useState<{ index: number; direction: 1 | -1 } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Two beats: the print slides clear of the pile, then the order changes and
  // it settles into its new place (under the pile going forward, on top going
  // back).
  const step = (direction: 1 | -1) => {
    if (fling) return;
    const index = direction === 1 ? top : (top - 1 + count) % count;
    setFling({ index, direction });
    timer.current = setTimeout(() => {
      setTop((t) => (t + direction + count) % count);
      setFling(null);
    }, FLING_MS);
  };

  const safeTop = top % count;

  return (
    <div className="overflow-hidden py-6">
      <div
        className="relative mx-auto w-[min(64%,340px)]"
        style={{ aspectRatio: "1 / 1.12" }}
      >
        {items.map((item, i) => {
          const depth = (i - safeTop + count) % count;
          const isFlung = fling?.index === i;
          if (depth > VISIBLE_DEPTH && depth !== count - 1 && !isFlung) return null;

          // Stable per-print scatter so the pile looks hand-dropped.
          const tilt = ((i * 37) % 11) - 5;
          const shift = ((i * 53) % 9) - 4;
          const transform = isFlung
            ? `translate(${fling.direction * 72}%, -4%) rotate(${fling.direction * 14}deg)`
            : `translate(${depth === 0 ? 0 : shift}px, ${Math.min(depth, VISIBLE_DEPTH) * 3}px) rotate(${depth === 0 ? tilt * 0.3 : tilt}deg)`;

          return (
            <div
              key={item.id}
              className="absolute inset-0 flex flex-col border border-inkstain/80 bg-[white] p-2 pb-0 shadow-[3px_4px_0_rgba(0,0,0,0.12)]"
              style={{
                transform,
                zIndex: count - depth,
                transition: "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
              aria-hidden={depth !== 0}
            >
              <div
                data-media-id={item.id}
                className="relative flex-1 overflow-hidden bg-inkstain/10 cursor-pointer"
                onClick={() => (depth === 0 ? onImageClick?.(item) : step(1))}
              >
                <MediaThumb
                  item={item}
                  alt={item.alt || item.caption || `Print ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 64vw, 340px"
                />
              </div>
              <div className="flex h-9 items-center justify-between gap-2 zissou-mono text-[11px] text-inkstain/70">
                <span className="truncate">{item.caption || " "}</span>
                <span className="shrink-0">No. {pad2(i + 1)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 text-inkstain">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous print"
          className="flex h-8 w-8 items-center justify-center rounded-full zissou-border bg-cream hover:bg-submarine-yellow/40 cursor-pointer"
        >
          <Chevron direction="left" />
        </button>
        <span className="zissou-mono text-xs tracking-widest">
          {pad2(safeTop + 1)} / {pad2(count)}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next print"
          className="flex h-8 w-8 items-center justify-center rounded-full zissou-border bg-cream hover:bg-submarine-yellow/40 cursor-pointer"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  );
}
