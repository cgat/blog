import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ReaderPage } from '@/components/pages/ReaderPage';

export const metadata = {
  title: 'Reader — The Archive of Small Things',
};

export default async function Reader() {
  const session = await auth();
  if (!session) {
    redirect('/');
  }
  return <ReaderPage />;
}
