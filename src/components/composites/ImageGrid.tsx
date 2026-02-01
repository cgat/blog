import Image from 'next/image';

interface ImageItem {
  id: string;
  url: string;
  alt?: string;
  width: number;
  height: number;
}

interface ImageGridProps {
  images: ImageItem[];
  expanded?: boolean;
}

export function ImageGrid({ images, expanded = false }: ImageGridProps) {
  if (images.length === 0) return null;

  const displayImages = expanded ? images : images.slice(0, 4);
  const remainingCount = images.length - 4;

  if (images.length === 1) {
    const img = images[0];
    return (
      <div className="rounded-lg overflow-hidden">
        <Image
          src={img.url}
          alt={img.alt || 'Post image'}
          width={img.width}
          height={img.height}
          className="w-full h-auto max-h-96 object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`grid gap-1 rounded-lg overflow-hidden ${
      displayImages.length === 2 ? 'grid-cols-2' :
      displayImages.length === 3 ? 'grid-cols-2' :
      'grid-cols-2'
    }`}>
      {displayImages.map((img, index) => (
        <div
          key={img.id}
          className={`relative ${
            displayImages.length === 3 && index === 0 ? 'row-span-2' : ''
          } ${expanded ? 'aspect-square' : 'aspect-square'}`}
        >
          <Image
            src={img.url}
            alt={img.alt || `Image ${index + 1}`}
            fill
            className="object-cover"
          />
          {!expanded && index === 3 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-2xl font-semibold">+{remainingCount}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
