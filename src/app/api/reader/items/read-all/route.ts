import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { markAllRead } from '@/lib/feeds';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const feedId = typeof body?.feedId === 'string' ? body.feedId : undefined;
  await markAllRead(feedId);
  return NextResponse.json({ success: true });
}
