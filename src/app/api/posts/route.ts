import { NextRequest, NextResponse } from 'next/server';
import { createPost, getPosts } from '@/lib/posts';
import { auth } from '@/auth';
import { computeFingerprint } from '@/lib/likes';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');
  const cursor = searchParams.get('cursor');
  const direction = (searchParams.get('direction') || 'older') as 'older' | 'newer';
  const tags = searchParams.get('tags')?.split(',').filter(Boolean);
  const includePrivateParam = searchParams.get('includePrivate') === 'true';
  const draftsOnly = searchParams.get('draftsOnly') === 'true';

  // Only honor includePrivate/draftsOnly when authenticated
  const session = (includePrivateParam || draftsOnly) ? await auth() : null;
  const includePrivate = includePrivateParam && !!session;
  const showDrafts = draftsOnly && !!session;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = computeFingerprint(ip, userAgent);

  const result = await getPosts({
    limit,
    cursor: cursor ? new Date(cursor) : undefined,
    direction,
    tagSlugs: tags,
    includePrivate,
    draftsOnly: showDrafts,
    fingerprint,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { content, tagIds, imageIds, isPrivate, isDraft } = body;

  if (!content?.trim() && (!imageIds || imageIds.length === 0)) {
    return NextResponse.json(
      { error: 'Content or images required' },
      { status: 400 }
    );
  }

  const post = await createPost({ content: content || '', tagIds, isPrivate: !!isPrivate, isDraft: !!isDraft }, imageIds || []);
  return NextResponse.json(post, { status: 201 });
}
