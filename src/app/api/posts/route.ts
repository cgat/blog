import { NextRequest, NextResponse } from 'next/server';
import { createPost, getPosts } from '@/lib/posts';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');
  const cursor = searchParams.get('cursor');
  const direction = (searchParams.get('direction') || 'older') as 'older' | 'newer';
  const tags = searchParams.get('tags')?.split(',').filter(Boolean);
  const includePrivateParam = searchParams.get('includePrivate') === 'true';

  // Only honor includePrivate when authenticated
  const session = includePrivateParam ? await auth() : null;
  const includePrivate = includePrivateParam && !!session;

  const result = await getPosts({
    limit,
    cursor: cursor ? new Date(cursor) : undefined,
    direction,
    tagSlugs: tags,
    includePrivate,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { content, tagIds, imageIds, isPrivate } = body;

  if (!content?.trim() && (!imageIds || imageIds.length === 0)) {
    return NextResponse.json(
      { error: 'Content or images required' },
      { status: 400 }
    );
  }

  const post = await createPost({ content: content || '', tagIds, isPrivate: !!isPrivate }, imageIds || []);
  return NextResponse.json(post, { status: 201 });
}
