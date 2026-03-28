'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Bell, MessageSquare, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';
import ElderFriendlyButton from './ElderFriendlyButton';
import { useI18n } from '@/lib/i18n';

interface LayoutProps {
  children: ReactNode;
  user: {
    id: number;
    name: string;
    avatar: string;
    is_admin?: number;
  };
}

export default function Layout({ children, user }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  // 获取第一个家族ID（从cookie或默认）
  const getDefaultFamilyHref = () => {
    // 成長專欄鏈接，默認帶 familyId=1，實際使用時會正確處理
    return '/plugins/growth-column?familyId=1';
  };

  // 导航菜单
  const navigation = [
    { name: t('home'), href: '/dashboard', icon: Home },
    { name: t('family'), href: '/families', icon: Users },
    { name: t('announcements'), href: '/announcements', icon: Bell },
    { name: t('messages'), href: '/messages', icon: MessageSquare },
    { name: t('chat'), href: '/chat', icon: MessageSquare },
    { name: '成長專欄', href: getDefaultFamilyHref(), icon: BookOpen },
  ];

  // 管理员专属导航
  const adminNavigation = [
    { name: t('system_admin'), href: '/admin', icon: Settings },
  ];

  // 处理登出
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Home className="h-8 w-8 text-family-500" />
            <span className="text-2xl font-bold text-family-800">{t('family_center')}</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-8 w-8 text-gray-600" /> : <Menu className="h-8 w-8 text-gray-600" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="h-full w-4/5 max-w-sm bg-white p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center space-x-4 mb-8 p-4 bg-family-50 rounded-xl">
              <img 
                src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                alt={user.name} 
                className="w-16 h-16 rounded-full" 
              />
              <div>
                <p className="text-xl font-semibold text-gray-900">{user.name}</p>
                <p className="text-lg text-gray-500">{t('welcome_back')}</p>
              </div>
            </div>

            <nav className="space-y-3">
              {navigation.map(item => {
                const Icon = item.icon;
                // For growth-column, match startsWith because it has query params ?familyId=xxx
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-4 rounded-xl font-semibold text-xl ${
                      isActive
                        ? 'bg-family-100 text-family-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* 管理员菜单 */}
              {user.is_admin === 1 && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 font-semibold mb-3 px-4">{t('system_admin')}</p>
                  {adminNavigation.map(item => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-4 px-4 py-4 rounded-xl font-semibold text-xl ${
                          isActive
                            ? 'bg-red-100 text-red-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-7 w-7" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* 登出已移除 - 无需登录注册 */}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:flex-col lg:bg-white lg:shadow-lg">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-200">
          <Home className="h-10 w-10 text-family-500" />
          <h1 className="text-2xl font-bold text-family-800">{t('family_center')}</h1>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto p-6">
          <div className="flex items-center space-x-4 mb-8 p-4 bg-family-50 rounded-xl">
            <img 
              src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
              alt={user.name} 
              className="w-16 h-16 rounded-full" 
            />
            <div>
              <p className="text-xl font-semibold text-gray-900">{user.name}</p>
              <p className="text-base text-gray-500">{t('welcome_back')}</p>
            </div>
          </div>

          <nav className="space-y-3 flex-1">
            {navigation.map(item => {
              const Icon = item.icon;
              // For growth-column, match startsWith because it has query params ?familyId=xxx
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-4 px-4 py-4 rounded-xl font-semibold text-xl ${
                    isActive
                      ? 'bg-family-100 text-family-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-7 w-7" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* 管理员菜单 */}
            {user.is_admin === 1 && (
              <div className="pt-6 border-t border-gray-200 mt-6">
                <p className="text-sm text-gray-500 font-semibold mb-3 px-4">管理员功能</p>
                {adminNavigation.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-4 px-4 py-4 rounded-xl font-semibold text-xl ${
                        isActive
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-7 w-7" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 登出已移除 - 无需登录注册 */}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 h-20">
        <div className="grid grid-cols-6 h-full">
          {navigation.map(item => {
            const Icon = item.icon;
            // For growth-column, match startsWith because it has query params ?familyId=xxx
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  isActive ? 'text-family-500' : 'text-gray-500'
                }`}
              >
                <Icon className="h-7 w-7" />
                <span className="text-xs font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Padding */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
