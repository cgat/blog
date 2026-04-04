# Navigation Cards & New Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add navigation cards (About, Guestbook, The Little Picture) to the sidebar and mobile header, create the About and Guestbook pages, and create a tag-filtered feed page at /thelittlepicture.

**Architecture:** Navigation cards live in Sidebar and Header components, using `usePathname()` to hide cards matching the current route. The guestbook gets its own DB table, API route, and page component. About is a static page. The Little Picture reuses FeedPage with a pre-set tag filter. Auth sign-in is removed from sidebar/header (accessible by route only).

**Tech Stack:** Next.js App Router, Drizzle ORM (SQLite), Tailwind CSS 4, React 19

---

### Task 1: Define navigation items and create NavCards component

**Files:**
- Create: `src/components/composites/NavCards.tsx`

**Step 1: Create NavCards component**

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { emoji: "📬", label: "About", href: "/about" },
  { emoji: "📓", label: "Guestbook", href: "/guestbook" },
  { emoji: "📸", label: "The Little Picture", href: "/thelittlepicture" },
];

interface NavCardsProps {
  minimized?: boolean;
  horizontal?: boolean;
}

export function NavCards({ minimized = false, horizontal = false }: NavCardsProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => item.href !== pathname);

  if (visibleItems.length === 0) return null;

  return (
    <div
      className={
        horizontal
          ? "flex gap-3 overflow-x-auto pb-2 scrollbar-none"
          : "flex flex-col gap-3"
      }
    >
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`zissou-border zissou-shadow bg-cream hover:bg-submarine-yellow/20 transition-none block ${
            horizontal ? "shrink-0" : ""
          } ${minimized ? "px-2 py-2 text-center" : "px-3 py-2"}`}
        >
          {minimized ? (
            <span className="text-lg">{item.emoji}</span>
          ) : (
            <span className="zissou-mono text-sm text-inkstain">
              {item.emoji} {item.label}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/composites/NavCards.tsx
git commit -m "feat: add NavCards component with route-aware visibility"
```

---

### Task 2: Add NavCards to Sidebar, remove auth

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Step 1: Replace sidebar content**

Remove the entire auth section (dropdown, sign-in button). Replace the spacer with NavCards. The sidebar becomes:

```tsx
"use client";

import { NavCards } from "../composites/NavCards";

interface SidebarProps {
  minimized?: boolean;
}

export function Sidebar({ minimized = false }: SidebarProps) {
  return (
    <aside className="sticky top-0 h-screen p-4 flex flex-col overflow-hidden">
      {/* Logo + Branding */}
      <div className="flex flex-row items-start gap-1">
        <a href="/">
          <img
            src="/filing_cabinet2.svg"
            alt="The Archive of Small Things"
            width="56px"
            height="56px"
            className="shrink-0 w-[2.6rem]"
          />
        </a>
        {!minimized && (
          <a href="/">
            <h2 className="zissou-heading text-[1.37rem] text-tracksuit-red font-black text-shadow-[2px_2px_0px_var(--submarine-yellow)] tracking-[0.2px]! leading-[1.1]! flex flex-col">
              <span>The Archive</span>
              <span className="inline-block text-[1rem]">of Small Things</span>
            </h2>
          </a>
        )}
      </div>

      {/* Nav Cards */}
      <div className="mt-6">
        <NavCards minimized={minimized} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: add nav cards to sidebar, remove auth dropdown"
```

---

### Task 3: Update mobile Header with folder-tab toggle and nav cards

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Step 1: Replace header content**

Remove auth dropdown. Add a folder-tab icon on the right that toggles a nav card tray that slides down. The tray shows NavCards in horizontal mode.

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { NavCards } from "../composites/NavCards";

export function Header() {
  const [showNav, setShowNav] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setShowNav(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b-2 border-inkstain bg-[white] sticky top-0 z-40" ref={navRef}>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex flex-row">
          <img
            src="/filing_cabinet2.svg"
            alt=""
            width="56px"
            height="56px"
            className="mr-1 w-[2.6rem]"
          />
          <h2 className="zissou-heading text-[1.37rem] text-tracksuit-red font-black text-shadow-[2px_2px_0px_var(--submarine-yellow)] tracking-[0.2px]! leading-[1.1]! flex flex-col">
            <span>The Archive</span>
            <span className="inline-block text-[1rem]">of Small Things</span>
          </h2>
        </a>

        {/* Folder tab toggle */}
        <button
          onClick={() => setShowNav(!showNav)}
          className="p-2 hover:bg-submarine-yellow/20 transition-none"
          aria-label="Navigation"
        >
          {/* File folder tab icon — Wes Anderson index card style */}
          <svg width="28" height="24" viewBox="0 0 28 24" fill="none" className="text-inkstain">
            <path
              d="M2 6h24v16H2V6z"
              stroke="currentColor"
              strokeWidth="2"
              fill="var(--cream)"
            />
            <path
              d="M2 6l3-4h8l3 4"
              stroke="currentColor"
              strokeWidth="2"
              fill="var(--submarine-yellow)"
            />
          </svg>
        </button>
      </div>

      {/* Expandable nav tray */}
      {showNav && (
        <div className="border-t-2 border-inkstain px-4 py-3">
          <NavCards horizontal />
        </div>
      )}
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat: add folder-tab nav toggle to mobile header, remove auth"
```

---

### Task 4: Create the About page

**Files:**
- Create: `src/app/about/page.tsx`

**Step 1: Create about page**

Static page using AppLayout, styled like a postcard with zissou design tokens. Lorem ipsum placeholder content.

```tsx
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata = {
  title: "About — The Archive of Small Things",
};

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Postcard */}
        <div className="zissou-border zissou-shadow bg-[white] relative">
          {/* Stamp decoration */}
          <div className="absolute top-4 right-4 w-16 h-20 zissou-border bg-mendls-pink/30 flex items-center justify-center rotate-3">
            <span className="text-2xl">📬</span>
          </div>

          <div className="p-8 pr-24">
            <h1 className="zissou-heading text-2xl text-tracksuit-red font-black mb-6">
              About This Archive
            </h1>

            <div className="space-y-4 zissou-mono text-sm leading-relaxed text-inkstain">
              <p>
                Dear visitor,
              </p>
              <p>
                Welcome to The Archive of Small Things — a personal collection of
                moments, photographs, thoughts, and miscellaneous ephemera that
                seemed worth preserving.
              </p>
              <p>
                This is a quiet corner of the internet where things are filed away
                not because they are important, but because they happened. A meal
                that was particularly good. A walk that went somewhere unexpected.
                A sentence overheard on the bus that refused to be forgotten.
              </p>
              <p>
                The archive operates on the principle that small things, properly
                catalogued, become their own kind of treasure. Nothing here is
                urgent. Everything here is, in its own way, true.
              </p>
              <p>
                Thank you for visiting the collection. You are welcome to browse
                at your leisure. Please do not touch the exhibits.
              </p>
              <p className="mt-8 italic">
                — The Archivist
              </p>
            </div>
          </div>

          {/* Postcard line decoration */}
          <div className="border-t-2 border-dashed border-inkstain/20 mx-8 mb-4" />
          <div className="px-8 pb-6">
            <p className="zissou-mono text-xs text-inkstain/40 uppercase tracking-widest">
              Est. 2026 · Published on own site, syndicated elsewhere
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: add About page with postcard layout"
```

---

### Task 5: Create guestbook database table and migration

**Files:**
- Modify: `src/db/schema.ts`

**Step 1: Add guestbook_entries table to schema**

Add after the `linkPreviews` table:

```ts
export const guestbookEntries = sqliteTable('guestbook_entries', {
  id: text('id').primaryKey(),
  name: text('name'),
  content: text('content').notNull(),
  fingerprint: text('fingerprint').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**Step 2: Generate migration**

```bash
npm run db:generate
```

**Step 3: Apply migration**

```bash
npm run db:migrate
```

**Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add guestbook_entries table"
```

---

### Task 6: Create guestbook business logic

**Files:**
- Create: `src/lib/guestbook.ts`

**Step 1: Create guestbook lib**

Follow the same pattern as `src/lib/comments.ts` — rate limiting, CRUD, types.

```ts
import { db } from '@/db';
import { guestbookEntries } from '@/db/schema';
import { and, gte, sql, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface GuestbookEntry {
  id: string;
  name: string | null;
  content: string;
  createdAt: Date;
}

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function getGuestbookEntries(): Promise<GuestbookEntry[]> {
  return db
    .select({
      id: guestbookEntries.id,
      name: guestbookEntries.name,
      content: guestbookEntries.content,
      createdAt: guestbookEntries.createdAt,
    })
    .from(guestbookEntries)
    .orderBy(desc(guestbookEntries.createdAt));
}

export async function createGuestbookEntry(
  content: string,
  fingerprint: string,
  name?: string
): Promise<GuestbookEntry> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
  const recentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(guestbookEntries)
    .where(
      and(
        sql`${guestbookEntries.fingerprint} = ${fingerprint}`,
        gte(guestbookEntries.createdAt, windowStart)
      )
    );

  if (recentCount[0].count >= RATE_LIMIT) {
    throw new RateLimitError();
  }

  const id = uuid();
  const now = new Date();
  const trimmedName = name?.trim().slice(0, 50) || null;
  const trimmedContent = content.trim().slice(0, 2000);

  await db.insert(guestbookEntries).values({
    id,
    name: trimmedName,
    content: trimmedContent,
    fingerprint,
    createdAt: now,
  });

  return { id, name: trimmedName, content: trimmedContent, createdAt: now };
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/guestbook.ts
git commit -m "feat: add guestbook business logic with rate limiting"
```

---

### Task 7: Create guestbook API route

**Files:**
- Create: `src/app/api/guestbook/route.ts`

**Step 1: Create API route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getGuestbookEntries, createGuestbookEntry, RateLimitError } from '@/lib/guestbook';
import { computeFingerprint } from '@/lib/likes';

export async function GET() {
  const entries = await getGuestbookEntries();
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  const body = await request.json();
  const { content, name } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  try {
    const entry = await createGuestbookEntry(content, fingerprint, name);
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Too many entries. Try again later.' },
        { status: 429 }
      );
    }
    throw err;
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/guestbook/route.ts
git commit -m "feat: add guestbook API route"
```

---

### Task 8: Create Guestbook page component

**Files:**
- Create: `src/app/guestbook/page.tsx`

**Step 1: Create the guestbook page**

Client component with notebook/handwritten aesthetic. Fun prompt, sequential entries, form at top.

```tsx
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

interface GuestbookEntry {
  id: string;
  name: string | null;
  content: string;
  createdAt: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

const PROMPTS = [
  "What brings you to the archive today?",
  "Leave a note for the archivist.",
  "What small thing are you thinking about?",
  "Sign the guestbook, if you please.",
  "What would you like to file away?",
];

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  useEffect(() => {
    fetch("/api/guestbook")
      .then((res) => res.json())
      .then(setEntries);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), name: name.trim() || undefined }),
      });

      if (res.status === 429) {
        setError("Too many entries — the archivist needs a moment to file these.");
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Try again.");
        return;
      }

      const entry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="zissou-heading text-2xl text-tracksuit-red font-black mb-2">
          📓 The Guestbook
        </h1>
        <p className="zissou-mono text-sm text-inkstain/60 mb-8">
          A record of visitors to the archive. All are welcome.
        </p>

        {/* Entry form — notebook style */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="zissou-border bg-[white] p-6 relative" style={{
            backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, var(--deep-ocean-teal) 27px, var(--deep-ocean-teal) 28px)",
            backgroundPosition: "0 40px",
          }}>
            {/* Red margin line */}
            <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-tracksuit-red/30" />

            <p className="zissou-mono text-sm text-inkstain/60 italic mb-4 pl-6">
              {prompt}
            </p>

            <div className="pl-6">
              <input
                type="text"
                placeholder="Your name (or leave blank for Anonymous)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full bg-transparent zissou-mono text-sm text-inkstain placeholder:text-inkstain/30 outline-none mb-4 pb-1"
              />
              <textarea
                placeholder="Write something..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full bg-transparent zissou-mono text-sm text-inkstain placeholder:text-inkstain/30 outline-none resize-none leading-[28px]"
              />
            </div>

            {error && (
              <p className="zissou-mono text-xs text-tracksuit-red mt-2 pl-6">{error}</p>
            )}

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="zissou-mono text-xs uppercase px-4 py-2 bg-inkstain text-cream zissou-border hover:bg-tracksuit-red disabled:opacity-50 transition-none"
              >
                {isSubmitting ? "Filing..." : "Sign the book"}
              </button>
            </div>
          </div>
        </form>

        {/* Entries */}
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="zissou-border bg-[white] p-5 relative"
              style={{
                backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, var(--deep-ocean-teal) 27px, var(--deep-ocean-teal) 28px)",
                backgroundPosition: "0 12px",
              }}
            >
              <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-tracksuit-red/30" />
              <div className="pl-6">
                <p className="zissou-mono text-sm text-inkstain leading-[28px] whitespace-pre-wrap">
                  {entry.content}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2">
                  <span className="zissou-mono text-xs text-inkstain/60 font-bold">
                    — {entry.name || "Anonymous"}
                  </span>
                  <span className="zissou-mono text-xs text-inkstain/40">
                    {timeAgo(new Date(entry.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <p className="zissou-mono text-sm text-inkstain/40 text-center py-8 italic">
              The guestbook is empty. Be the first to sign it.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/guestbook/page.tsx
git commit -m "feat: add Guestbook page with notebook-style entries"
```

---

### Task 9: Create The Little Picture page

**Files:**
- Create: `src/app/thelittlepicture/page.tsx`

**Step 1: Create the page**

Reuses FeedPage with a pre-applied tag filter. Pass the tag name so FeedPage can pre-select it.

FeedPage needs a small modification to accept `initialTags` — or we can create a wrapper that sets the tag. The simpler approach: create a thin page that renders FeedPage with `initialTags`.

First, modify `FeedPage` to accept `initialTags`:

In `src/components/pages/FeedPage.tsx`, change the interface and initial state:

```ts
interface FeedPageProps {
  includePrivate?: boolean;
  initialTags?: string[];
}

export function FeedPage({ includePrivate = false, initialTags = [] }: FeedPageProps) {
  // ... existing code
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
```

Then create the page:

```tsx
import { FeedPage } from "@/components/pages/FeedPage";

export const metadata = {
  title: "The Little Picture — The Archive of Small Things",
};

export default function TheLittlePicturePage() {
  return <FeedPage initialTags={["The Little Picture"]} />;
}
```

**Step 2: Commit**

```bash
git add src/app/thelittlepicture/page.tsx src/components/pages/FeedPage.tsx
git commit -m "feat: add The Little Picture page with tag-filtered feed"
```

---

### Task 10: Create sign-in page route

**Files:**
- Create: `src/app/signin/page.tsx`

**Step 1: Create sign-in page**

Since auth was removed from sidebar/header, provide a route for signing in.

```tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

export default function SignInPage() {
  const { data: session } = useSession();

  if (session) {
    redirect("/");
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="zissou-heading text-xl text-tracksuit-red font-black mb-6">
          Archivist Access
        </h1>
        <p className="zissou-mono text-sm text-inkstain/60 mb-8">
          Authorized personnel only.
        </p>
        <button
          onClick={() => signIn("google")}
          className="zissou-mono text-sm uppercase px-6 py-3 bg-inkstain text-cream zissou-border hover:bg-tracksuit-red transition-none"
        >
          Sign in with Google
        </button>
      </div>
    </AppLayout>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/signin/page.tsx
git commit -m "feat: add dedicated sign-in page"
```

---

### Task 11: Visual polish and testing

**Step 1: Run dev server and test all routes**

```bash
npm run dev
```

Verify:
- `/` — feed page, sidebar shows 3 nav cards (About, Guestbook, The Little Picture)
- `/about` — postcard page, sidebar hides About card
- `/guestbook` — notebook entries, form works, sidebar hides Guestbook card
- `/thelittlepicture` — feed filtered by tag, sidebar hides The Little Picture card
- `/signin` — sign-in page works
- Mobile: header shows folder-tab icon, tapping reveals horizontal nav cards
- Sidebar minimized state: only emojis shown

**Step 2: Fix any visual issues found during testing**

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: visual polish for navigation cards and new pages"
```
