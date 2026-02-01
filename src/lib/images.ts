import { db } from '@/db';
import { images } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = './uploads';

export interface ImageMeta {
  id: string;
  filename: string;
  originalFilename: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadImage(file: File): Promise<ImageMeta> {
  await ensureUploadDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = uuid();
  const ext = path.extname(file.name) || '.jpg';
  const filename = `${id}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Get basic image info without sharp for now
  // In production, we'd use sharp for proper metadata extraction
  const width = 800;
  const height = 600;

  // Save original file
  await writeFile(filepath, buffer);

  const imageMeta: ImageMeta = {
    id,
    filename,
    originalFilename: file.name,
    width,
    height,
    sizeBytes: buffer.length,
    mimeType: file.type,
  };

  // Save to database (without post_id initially)
  await db.insert(images).values({
    ...imageMeta,
    postId: '', // Will be updated when post is created
    position: 0,
    createdAt: new Date(),
  });

  return imageMeta;
}

export async function getImageFile(filename: string): Promise<Buffer | null> {
  const filepath = path.join(UPLOAD_DIR, filename);

  if (!existsSync(filepath)) {
    return null;
  }

  return readFile(filepath);
}

export async function deleteImage(id: string): Promise<void> {
  const image = await db.select().from(images).where(eq(images.id, id));

  if (image.length > 0) {
    const filepath = path.join(UPLOAD_DIR, image[0].filename);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }
    await db.delete(images).where(eq(images.id, id));
  }
}
