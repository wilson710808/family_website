import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateFamilyClient from './page.client';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function CreateFamilyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return <CreateFamilyClient />;
}
