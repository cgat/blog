import { timingSafeEqual } from 'crypto';
import { auth } from '@/auth';

const API_TOKEN = process.env.BLOG_API_TOKEN;

function hasValidBearerToken(request: Request): boolean {
  if (!API_TOKEN) return false;

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;

  const provided = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(API_TOKEN);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

// Authorizes either the signed-in owner (session cookie) or a script/MCP client
// presenting `Authorization: Bearer $BLOG_API_TOKEN`.
export async function isAuthorized(request: Request): Promise<boolean> {
  if (hasValidBearerToken(request)) return true;
  return !!(await auth());
}
