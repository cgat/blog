import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getActivity, getActivityLastSeen, setActivityLastSeen } from '@/lib/activity';
import { ActivityPage } from '@/components/pages/ActivityPage';

export const metadata = {
  title: 'Activity — The Archive of Small Things',
};

export default async function Activity() {
  const session = await auth();
  if (!session) {
    redirect('/');
  }

  const previousLastSeen = await getActivityLastSeen();
  const events = await getActivity({ limit: 100 });
  await setActivityLastSeen(new Date());

  const serializableEvents = events.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <ActivityPage
      events={serializableEvents}
      lastSeenAt={previousLastSeen ? previousLastSeen.toISOString() : null}
    />
  );
}
