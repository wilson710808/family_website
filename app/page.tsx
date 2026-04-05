import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function HomePage() {
  // 自动登录：始终获取管理员用户，直接跳转到仪表板
  // 不需要注册和登录，所有访问者都直接以管理员身份进入
  redirect('/dashboard');
}
