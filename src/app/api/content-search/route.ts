import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { contentSources } from '@/lib/content-sources';
import type { SearchResult } from '@/lib/content-sources';

async function searchWithClaude(query: string, site: string): Promise<SearchResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3,
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Use web search to find "${query}" on ${site}. Return the top results as a JSON array with objects containing "title", "url", and "snippet" fields. Return ONLY the JSON array, no other text.`,
      },
    ],
  });

  // Extract the text response from Claude
  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return [];

  // Parse the JSON from Claude's response
  try {
    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as SearchResult[];
    return parsed.slice(0, 5).map((r) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.snippet || '',
    }));
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sourceId, query } = await request.json();

  if (!sourceId || !query?.trim()) {
    return NextResponse.json({ error: 'sourceId and query are required' }, { status: 400 });
  }

  const source = contentSources.find((s) => s.id === sourceId);
  if (!source) {
    return NextResponse.json({ error: 'Unknown source' }, { status: 400 });
  }

  try {
    const results = await searchWithClaude(query.trim(), source.site);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
