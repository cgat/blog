import { NextRequest, NextResponse } from 'next/server';
import { getImageFile } from '@/lib/images';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const file = await getImageFile(filename);

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Determine content type from filename
  const ext = filename.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': contentTypes[ext || 'jpg'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
