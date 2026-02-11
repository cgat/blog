interface LinkPreviewProps {
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  domain: string;
}

export function LinkPreview({ url, title, description, imageUrl, domain }: LinkPreviewProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow not-prose"
    >
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={title || ''}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={`px-4 ${imageUrl ? 'py-3' : 'py-4'}`}>
        {title && (
          <p className="font-semibold text-deep-space line-clamp-2 text-sm">
            {title}
          </p>
        )}
        {description && (
          <p className="text-gray-600 text-sm line-clamp-3 mt-1">
            {description}
          </p>
        )}
        <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {domain}
        </p>
      </div>
    </a>
  );
}
