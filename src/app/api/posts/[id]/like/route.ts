import { NextRequest, NextResponse } from 'next/server';
import { computeFingerprint, toggleLike, getLikeCount } from '@/lib/likes';
import { getPost } from '@/lib/posts';
import { db } from '@/db';
import { likes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  const result = await toggleLike(id, fingerprint);
  return NextResponse.json(result);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  const likeCount = await getLikeCount(id);
  const existing = await db.query.likes.findFirst({
    where: and(eq(likes.postId, id), eq(likes.fingerprint, fingerprint)),
  });

  return NextResponse.json({ likeCount, likedByMe: !!existing });
}
