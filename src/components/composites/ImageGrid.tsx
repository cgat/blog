import Image from 'next/image';

interface ImageItem {
  id: string;
  url: string;
  alt?: string;
  width: number;
  height: number;
  featured?: boolean;
}

interface ImageGridProps {
  images: ImageItem[];
  expanded?: boolean;
}

export function ImageGrid({ images, expanded = false }: ImageGridProps) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    const img = images[0];
    return (
      <div className="overflow-hidden zissou-border">
        <Image
          src={img.url}
          alt={img.alt || 'Post image'}
          width={img.width}
          height={img.height}
          className="w-full h-auto"
        />
      </div>
    );
  }

  // Find the featured image: first with featured flag, otherwise first image
  const featuredIndex = images.findIndex((img) => img.featured);
  const featured = featuredIndex >= 0 ? images[featuredIndex] : images[0];
  const isPortrait = featured.height > featured.width;

  // Remaining images (everything except the featured one)
  const rest = images.filter((img) => img.id !== featured.id);

  const CELLS_PER_AXIS = 8;

  if (isPortrait) {
    // Portrait: featured left, grid right
    // Grid fills 8 rows then wraps into new columns, max-height = featured image height
    // Cell size = featured_height / 8
    const maxVisible = expanded ? rest.length : CELLS_PER_AXIS * 2;
    const displayRest = rest.slice(0, maxVisible);
    const remainingCount = rest.length - displayRest.length;

    return (
      <div
        className="flex gap-1 overflow-hidden"
        style={{ aspectRatio: `${featured.width * 2} / ${featured.height}` }}
      >
        {/* Featured image — portrait, left side, no crop */}
        <div className="h-full shrink-0 zissou-border overflow-hidden">
          <Image
            src={featured.url}
            alt={featured.alt || 'Featured image'}
            width={featured.width}
            height={featured.height}
            className="h-full w-auto"
          />
        </div>

        {/* Remaining images — square cells, 8 per column, flowing into new columns */}
        <div
          className="flex-1 grid gap-1 overflow-hidden"
          style={{
            gridTemplateRows: `repeat(${CELLS_PER_AXIS}, 1fr)`,
            gridAutoFlow: 'column',
            gridAutoColumns: '1fr',
          }}
        >
          {displayRest.map((img, index) => (
            <div
              key={img.id}
              className="relative zissou-border overflow-hidden"
            >
              <Image
                src={img.url}
                alt={img.alt || `Image ${index + 2}`}
                fill
                className="object-cover"
              />
              {!expanded && index === displayRest.length - 1 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-inkstain/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold zissou-heading">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Landscape: featured on top, grid below
  // Grid has 8 columns, max-height constrained to featured image width
  // (i.e. the grid area below is a square-ish zone 8 columns wide)
  const maxVisible = expanded ? rest.length : CELLS_PER_AXIS * 2;
  const displayRest = rest.slice(0, maxVisible);
  const remainingCount = rest.length - displayRest.length;

  return (
    <div className="flex flex-col gap-1 overflow-hidden">
      {/* Featured image — landscape, full width, no crop */}
      <div className="zissou-border overflow-hidden">
        <Image
          src={featured.url}
          alt={featured.alt || 'Featured image'}
          width={featured.width}
          height={featured.height}
          className="w-full h-auto"
        />
      </div>

      {/* Remaining images — 8 columns of square cells */}
      {displayRest.length > 0 && (
        <div
          className="grid gap-1 overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${CELLS_PER_AXIS}, 1fr)`,
          }}
        >
          {displayRest.map((img, index) => (
            <div
              key={img.id}
              className="relative zissou-border aspect-square overflow-hidden"
            >
              <Image
                src={img.url}
                alt={img.alt || `Image ${index + 2}`}
                fill
                className="object-cover"
              />
              {!expanded && index === displayRest.length - 1 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-inkstain/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold zissou-heading">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
