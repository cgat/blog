import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteFeed } from '@/lib/feeds';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteFeed(id);
  return NextResponse.json({ success: true });
}
