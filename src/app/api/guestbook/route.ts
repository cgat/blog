import { NextRequest, NextResponse } from 'next/server';
import { getGuestbookEntries, createGuestbookEntry, RateLimitError } from '@/lib/guestbook';
import { computeFingerprint } from '@/lib/likes';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  const entries = await getGuestbookEntries({ includePrivate: !!session });
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
  const { content, name, isPrivate } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  try {
    const entry = await createGuestbookEntry(content, fingerprint, name, isPrivate);
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
