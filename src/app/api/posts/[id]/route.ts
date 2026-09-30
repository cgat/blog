import { NextRequest, NextResponse } from 'next/server';
import { getPost, updatePost, deletePost } from '@/lib/posts';
import { isAuthorized } from '@/lib/api-auth';
import { computeFingerprint } from '@/lib/likes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  // Only honor includePrivate (private posts and drafts) when authenticated
  const includePrivate = request.nextUrl.searchParams.get('includePrivate') === 'true'
    && await isAuthorized(request);
  const post = await getPost(id, { fingerprint, includePrivate, includeDrafts: includePrivate });

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  for (const field of ['createdAt', 'publishedAt'] as const) {
    if (body[field] && isNaN(new Date(body[field]).getTime())) {
      return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
    }
  }

  const post = await updatePost(id, body);

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await deletePost(id);
  return NextResponse.json({ success: true });
}
