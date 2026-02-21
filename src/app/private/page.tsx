import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { FeedPage } from '@/components/pages/FeedPage';

export default async function PrivatePage() {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  return <FeedPage includePrivate />;
}
