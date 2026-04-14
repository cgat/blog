import { FeedPage } from '@/components/pages/FeedPage';
import { getPost } from '@/lib/posts';
import { extractTitle } from '@/lib/og-utils';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: 'Post not found' };
  }

  const title = extractTitle(post);
  const description = post.content.slice(0, 200);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/posts/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PostPage() {
  return <FeedPage />;
}
