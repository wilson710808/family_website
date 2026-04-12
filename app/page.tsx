import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function HomePage() {
  const user = await getCurrentUser();

  // 如果未登录，显示登录页面
  if (!user) {
    redirect('/login');
  }

  // 已登录，跳转到个人首页
  redirect('/home');
}
