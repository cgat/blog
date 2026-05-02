import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listItems } from '@/lib/feeds';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const unreadOnly = params.get('unread') === '1';
  const feedId = params.get('feedId') ?? undefined;
  const limit = Math.min(Number(params.get('limit')) || 50, 200);
  const cursorRaw = params.get('cursor');
  const cursor = cursorRaw ? new Date(cursorRaw) : undefined;

  const result = await listItems({ unreadOnly, feedId, limit, cursor });
  return NextResponse.json(result);
}
