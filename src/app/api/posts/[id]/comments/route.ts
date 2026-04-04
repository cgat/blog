import { NextRequest, NextResponse } from 'next/server';
import { getComments, createComment, RateLimitError } from '@/lib/comments';
import { getPost } from '@/lib/posts';
import { computeFingerprint } from '@/lib/likes';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await auth();
  const result = await getComments(id, { includePrivate: !!session });
  return NextResponse.json(result);
}

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

  const body = await request.json();
  const { content, name, isPrivate } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  try {
    const comment = await createComment(id, content, fingerprint, name, isPrivate);
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Too many comments. Try again later.' },
        { status: 429 }
      );
    }
    throw err;
  }
}
