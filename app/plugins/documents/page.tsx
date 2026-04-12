import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import { db } from '@/lib/db';
import DocumentsClient from './page.client';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function DocumentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const families = await getUserFamilies(user.id);
  const approvedFamilies = families.filter(f => f.status === 'approved');

  return <DocumentsClient user={user} families={approvedFamilies} />;
}
