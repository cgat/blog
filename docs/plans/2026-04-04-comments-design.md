# Anonymous Comments

## Data Model

New `comments` table:

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | UUID |
| postId | text FK | References posts.id, cascade delete |
| name | text, nullable | Display name, max 50 chars. Null = "Anonymous" |
| content | text | Plain text, max 2000 chars |
| fingerprint | text | For rate limiting (same pattern as likes) |
| createdAt | timestamp | |

`PostWithRelations` gains a `commentCount: number` field.

Rate limit: 7 comments per hour per fingerprint (across all posts).

## API

- `GET /api/posts/[id]/comments` — returns comments oldest-first. No pagination.
- `POST /api/posts/[id]/comments` — body: `{ name?: string, content: string }`. Fingerprint from request headers. Returns 429 if rate limited.
- `DELETE /api/posts/[id]/comments/[commentId]` — authenticated owner only.
- Existing post endpoints include `commentCount` in responses.

## UI

**PostCard**: comment bubble icon + count next to like/dislike buttons. Calls `onComment(postId)`.

**CommentsPanel**: follows ImageViewer dual-mode pattern (inline on desktop, modal on mobile via AppLayout panel prop).
- Header: post preview + close button
- Scrollable comment list: name (or "Anonymous"), content, relative timestamp. Owner sees delete button.
- Fixed input area at bottom: optional name field (max 50 chars), textarea, submit button.

**FeedPage**: manages `commentPostId` state. When set, passes `<CommentsPanel>` as panel to AppLayout, replacing any existing panel.
