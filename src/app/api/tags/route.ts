import { NextRequest, NextResponse } from 'next/server';
import { getAllTags, getOrCreateTag } from '@/lib/tags';
import { auth } from '@/auth';

export async function GET() {
  const tagsList = await getAllTags();
  return NextResponse.json(tagsList);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }

  const tag = await getOrCreateTag(name.trim());
  return NextResponse.json(tag, { status: 201 });
}
