import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateFamilyClient from './page.client';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function CreateFamilyPage() {
  // 完全移除认证检查 - 始终允许访问
  return <CreateFamilyClient />;
}
