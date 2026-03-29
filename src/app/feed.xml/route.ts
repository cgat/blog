import { db } from '@/db';
import { posts } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const recentPosts = await db.query.posts.findMany({
    where: eq(posts.isPrivate, false),
    orderBy: desc(posts.createdAt),
    limit: 50,
  });

  const items = recentPosts.map((post) => {
    const title = post.content.slice(0, 80).replace(/\n/g, ' ');
    const pubDate = (post.publishedAt || post.createdAt).toUTCString();

    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${baseUrl}/posts/${post.id}</link>
      <guid isPermaLink="true">${baseUrl}/posts/${post.id}</guid>
      <description>${escapeXml(post.content)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  }).join('\n');

  const lastBuildDate = recentPosts[0]
    ? (recentPosts[0].publishedAt || recentPosts[0].createdAt).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Archive of Small Things</title>
    <link>${baseUrl}</link>
    <description>My corner of the internet</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
