import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addFeed, listFeeds } from '@/lib/feeds';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const feeds = await listFeeds();
  return NextResponse.json({ feeds });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const url = body?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  try {
    const feed = await addFeed(url);
    return NextResponse.json(feed, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add feed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
