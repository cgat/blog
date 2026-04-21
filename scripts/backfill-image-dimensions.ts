/**
 * Backfill real width/height for images whose dimensions were recorded
 * incorrectly (the original upload path hardcoded 800x600).
 *
 * Usage:
 *   npx tsx scripts/backfill-image-dimensions.ts          # dry run
 *   npx tsx scripts/backfill-image-dimensions.ts --write  # actually update
 */

import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import sharp from 'sharp';

const DB_PATH = process.env.BLOG_DB_PATH ?? path.resolve('data/blog.db');
const UPLOADS_DIR = process.env.BLOG_UPLOADS_DIR ?? path.resolve('uploads');
const WRITE = process.argv.includes('--write');

console.log(`db=${DB_PATH} uploads=${UPLOADS_DIR} write=${WRITE}`);

interface Row {
  id: string;
  filename: string;
  width: number;
  height: number;
  mime_type: string;
}

async function main() {
  const db = new Database(DB_PATH);
  const rows = db
    .prepare('SELECT id, filename, width, height, mime_type FROM images')
    .all() as Row[];

  const update = db.prepare('UPDATE images SET width = ?, height = ? WHERE id = ?');

  let updated = 0;
  let skipped = 0;
  let missing = 0;
  let errors = 0;

  for (const row of rows) {
    if (row.mime_type?.startsWith('video/')) {
      skipped++;
      continue;
    }

    const filepath = path.join(UPLOADS_DIR, row.filename);
    if (!fs.existsSync(filepath)) {
      console.warn(`MISSING ${row.id} ${row.filename}`);
      missing++;
      continue;
    }

    try {
      const meta = await sharp(filepath).metadata();
      const rotated =
        meta.orientation && meta.orientation >= 5 && meta.orientation <= 8;
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      const realW = rotated ? h : w;
      const realH = rotated ? w : h;

      if (!realW || !realH) {
        console.warn(`NO_DIMS ${row.id} ${row.filename}`);
        errors++;
        continue;
      }

      if (realW === row.width && realH === row.height) {
        skipped++;
        continue;
      }

      console.log(
        `${WRITE ? 'UPDATE' : 'WOULD'} ${row.id} ${row.filename}: ${row.width}x${row.height} -> ${realW}x${realH}`
      );

      if (WRITE) update.run(realW, realH, row.id);
      updated++;
    } catch (err) {
      console.error(`ERROR ${row.id} ${row.filename}:`, err);
      errors++;
    }
  }

  console.log(
    `\nDone. ${WRITE ? 'updated' : 'would update'}=${updated} unchanged=${skipped} missing=${missing} errors=${errors} total=${rows.length}`
  );
  if (!WRITE) console.log('Re-run with --write to apply.');
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
