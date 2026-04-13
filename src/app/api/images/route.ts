import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/images';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 });
  }

  const imageMeta = await uploadImage(file);
  return NextResponse.json(imageMeta, { status: 201 });
}
