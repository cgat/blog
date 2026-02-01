import { FeedPage } from '@/components/pages/FeedPage';
import { getPost } from '@/lib/posts';
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

  const title = post.content.slice(0, 60) || 'Post';
  const description = post.content.slice(0, 200);
  const image = post.images[0]?.url || `/api/og/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/posts/${id}`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  return <FeedPage focusedPostId={id} />;
}
