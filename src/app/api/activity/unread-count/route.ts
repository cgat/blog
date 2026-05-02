import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getActivityLastSeen, getUnreadCount } from '@/lib/activity';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lastSeen = await getActivityLastSeen();
  const count = await getUnreadCount(lastSeen);
  return NextResponse.json({ count });
}
