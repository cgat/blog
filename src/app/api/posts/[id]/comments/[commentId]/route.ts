import { NextRequest, NextResponse } from 'next/server';
import { deleteComment } from '@/lib/comments';
import { auth } from '@/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { commentId } = await params;
  await deleteComment(commentId);
  return NextResponse.json({ success: true });
}
