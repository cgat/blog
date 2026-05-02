import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { markItemRead } from '@/lib/feeds';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const read = body?.read !== false;
  await markItemRead(id, read);
  return NextResponse.json({ success: true });
}
