"use client";

import { AppLayout } from "../layout/AppLayout";
import { ActivityRow } from "../composites/ActivityRow";

interface SerializedEvent {
  type: "post-like" | "photo-like" | "comment" | "guestbook";
  id: string;
  createdAt: string;
  postId?: string;
  postExcerpt?: string;
  name?: string | null;
  snippet?: string;
  imageId?: string;
}

interface ActivityPageProps {
  events: SerializedEvent[];
  lastSeenAt: string | null;
}

function formatDivider(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityPage({ events, lastSeenAt }: ActivityPageProps) {
  const lastSeen = lastSeenAt ? new Date(lastSeenAt) : null;
  const lastSeenMs = lastSeen ? lastSeen.getTime() : null;

  const dividerIndex = (() => {
    if (lastSeenMs === null) return events.length; // first visit: everything is new
    for (let i = 0; i < events.length; i++) {
      if (new Date(events[i].createdAt).getTime() <= lastSeenMs) {
        return i;
      }
    }
    return events.length; // all events are newer than last seen
  })();

  const dividerLabel = lastSeen
    ? `new since ${formatDivider(lastSeen)}`
    : "new — your first visit";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="zissou-heading text-2xl font-black text-tracksuit-red mb-2">
          Activity
        </h1>
        <p className="zissou-mono text-xs text-inkstain/60 mb-6">
          The archivist&apos;s daily log: who&apos;s been by, what they touched.
        </p>

        {events.length === 0 ? (
          <p className="zissou-mono text-sm text-inkstain/50">
            Nothing&apos;s happened yet.
          </p>
        ) : (
          <div className="zissou-border bg-white px-4 py-2 divide-y-2 divide-dashed divide-inkstain/15">
            {events.map((event, i) => (
              <div key={`${event.type}:${event.id}`}>
                {i === dividerIndex && i > 0 && (
                  <div className="zissou-mono text-[11px] text-inkstain/50 text-center py-2 tracking-widest">
                    ─── {dividerLabel} ───
                  </div>
                )}
                <ActivityRow
                  kind={event.type}
                  createdAt={event.createdAt}
                  postId={event.postId}
                  postExcerpt={event.postExcerpt}
                  name={event.name}
                  snippet={event.snippet}
                />
              </div>
            ))}
            {dividerIndex === events.length && events.length > 0 && (
              <div className="zissou-mono text-[11px] text-inkstain/50 text-center py-2 tracking-widest">
                ─── {dividerLabel} ───
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
