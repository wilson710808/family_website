import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateFamilyClient from './page.client';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function CreateFamilyPage() {
  const user = await getCurrentUser();

  // 未登录重定向到登录页
  if (!user) {
    redirect('/login');
  }

  return <CreateFamilyClient />;
}
