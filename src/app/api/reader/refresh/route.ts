import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchAndStoreFeed, refreshStaleFeeds } from '@/lib/feeds';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const feedId = request.nextUrl.searchParams.get('id');
  if (feedId) {
    const result = await fetchAndStoreFeed(feedId);
    return NextResponse.json(result);
  }

  const force = request.nextUrl.searchParams.get('force') === '1';
  const result = await refreshStaleFeeds(force ? 0 : undefined);
  return NextResponse.json(result);
}
