"use client";

interface FeedItemCardProps {
  title: string;
  url: string;
  feedTitle: string;
  accentClassName: string;
  summary?: string | null;
  author?: string | null;
  publishedAt?: Date | string | null;
  isUnread: boolean;
  onOpen?: () => void;
  onToggleRead?: () => void;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return date.toLocaleDateString();
}

export function FeedItemCard({
  title,
  url,
  feedTitle,
  accentClassName,
  summary,
  author,
  publishedAt,
  isUnread,
  onOpen,
  onToggleRead,
}: FeedItemCardProps) {
  const dateObj = publishedAt
    ? publishedAt instanceof Date
      ? publishedAt
      : new Date(publishedAt)
    : null;
  const time = dateObj && !Number.isNaN(dateObj.getTime()) ? relativeTime(dateObj) : null;

  return (
    <article
      className={`zissou-border bg-white flex transition-none hover:zissou-shadow overflow-hidden ${
        isUnread ? '' : 'opacity-70'
      }`}
    >
      <div className={`w-1.5 shrink-0 ${accentClassName}`} aria-hidden="true" />

      <div className="flex-1 min-w-0 px-4 py-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          className="block group"
        >
          <h3
            className={`zissou-heading text-base leading-snug text-inkstain group-hover:text-tracksuit-red ${
              isUnread ? 'font-bold' : 'font-normal'
            }`}
          >
            {title}
          </h3>
        </a>

        <div className="zissou-mono text-[11px] text-inkstain/60 mt-1 flex flex-wrap items-center gap-x-2">
          <span className="text-deep-ocean-teal">{feedTitle}</span>
          {author && <span>· {author}</span>}
          {time && <span>· {time}</span>}
        </div>

        {summary && (
          <p className="zissou-mono text-sm text-inkstain/80 mt-2 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        )}

        {onToggleRead && (
          <div className="mt-2">
            <button
              type="button"
              onClick={onToggleRead}
              className="zissou-mono text-[11px] text-inkstain/50 hover:text-deep-ocean-teal underline decoration-dotted underline-offset-2"
            >
              {isUnread ? 'Mark as read' : 'Mark as unread'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
