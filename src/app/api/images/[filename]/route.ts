import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { Readable } from 'stream';
import { getImageFilePath } from '@/lib/images';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

function streamFile(filepath: string, range?: { start: number; end: number }) {
  return Readable.toWeb(createReadStream(filepath, range)) as ReadableStream<Uint8Array>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filepath = getImageFilePath(filename);

  if (!filepath) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { size } = await stat(filepath);
  const ext = filename.split('.').pop()?.toLowerCase();
  const headers = {
    'Content-Type': CONTENT_TYPES[ext || 'jpg'] || 'image/jpeg',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  };

  // Range requests let browsers fetch just the part of a video they need
  // (and seek) instead of downloading the whole file every time one mounts.
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
  if (match && (match[1] || match[2])) {
    let start: number;
    let end: number;
    if (match[1] === '') {
      // "bytes=-N": the last N bytes
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    }

    if (start > end || start >= size) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...headers, 'Content-Range': `bytes */${size}` },
      });
    }

    return new NextResponse(streamFile(filepath, { start, end }), {
      status: 206,
      headers: {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(end - start + 1),
      },
    });
  }

  return new NextResponse(streamFile(filepath), {
    headers: { ...headers, 'Content-Length': String(size) },
  });
}
