'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Bell, MessageSquare, BookOpen, Bot, Settings, LogOut, Menu, X } from 'lucide-react';
import ElderFriendlyButton from './ElderFriendlyButton';
import VersionBadge from './VersionBadge';
import NotificationBell from './NotificationBell';
import { useI18n } from '@/lib/i18n';
import { isEnabled as isGrowthColumnEnabled } from '../plugins/growth-column/index.client';
import { isEnabled as isFamilyButlerEnabled } from '../plugins/family-butler/index.client';

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

  // 导航菜单 - 基础导航
  const baseNavigation = [
    { name: t('home'), href: '/dashboard', icon: Home },
    { name: t('family'), href: '/families', icon: Users },
    { name: t('announcements'), href: '/announcements', icon: Bell },
    { name: t('messages'), href: '/messages', icon: MessageSquare },
    { name: t('chat'), href: '/chat', icon: MessageSquare },
  ];

  // 獲取第一個家族ID（從cookie或默認）
  const getDefaultFamilyHrefWithId = (path: string) => {
    // 默認帶 familyId=1，實際使用時會正確處理
    return `${path}?familyId=1`;
  };

  // 插件只有启用了才添加到导航中（真正的插拔体验）
  const navigation = [...baseNavigation];
  if (isGrowthColumnEnabled()) {
    navigation.push({ name: '成長專欄', href: getDefaultFamilyHrefWithId('/plugins/growth-column'), icon: BookOpen });
  }
  if (isFamilyButlerEnabled()) {
    navigation.push({ name: '家族管家', href: getDefaultFamilyHrefWithId('/plugins/family-butler'), icon: Bot });
  }

  // 底部导航：根据启用插件数量动态设置列数，保证都在同一行
  const enabledPluginsCount = [isGrowthColumnEnabled(), isFamilyButlerEnabled()].filter(Boolean).length;
  const totalItems = baseNavigation.length + enabledPluginsCount;
  const bottomNavigation = navigation.slice(0, totalItems);

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
        <div className="px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Home className="h-7 w-7 text-family-500" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-family-800">{t('family_center')}</span>
              <span className="text-xs text-gray-400">v1.2.5</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell userId={user.id} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-7 w-7 text-gray-600" /> : <Menu className="h-7 w-7 text-gray-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="h-screen max-h-screen w-3/4 max-w-[280px] bg-white flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 p-3">
              <div className="flex items-center space-x-3 p-3 bg-family-50 rounded-xl">
                <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={user.name} className="w-12 h-12 rounded-full" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{t('welcome_back')}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <nav className="space-y-2 px-2 py-3">
                {navigation.map(item => {
                  const Icon = item.icon;
                  // For growth-column, match startsWith because it has query params ?familyId=xxx
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl font-medium text-lg ${
                        isActive ? 'bg-family-100 text-family-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                {/* 管理员菜单 */}
                {user.is_admin === 1 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-2 px-3">{t('system_admin')}</p>
                    {adminNavigation.map(item => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-3 rounded-xl font-medium text-lg ${
                            isActive ? 'bg-red-100 text-red-700' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {/* 登出按钮 */}
                <div className="pt-4 border-t border-gray-200 pb-8">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-3 rounded-xl font-medium text-lg text-red-700 hover:bg-red-50 w-full"
                  >
                    <LogOut className="h-6 w-6" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:bg-white lg:shadow-lg">
        <div className="p-4 flex items-center space-x-2 border-b border-gray-200">
          <Home className="h-8 w-8 text-family-500" />
          <div>
            <h1 className="text-xl font-bold text-family-800">{t('family_center')}</h1>
            <p className="text-xs text-gray-400">v1.2.5</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex items-center space-x-3 mb-6 p-3 mx-3 bg-family-50 rounded-xl">
            <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={user.name} className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{t('welcome_back')}</p>
            </div>
            <NotificationBell userId={user.id} />
          </div>
          <nav className="space-y-2 flex-1 overflow-y-auto px-3">
            {navigation.map(item => {
              const Icon = item.icon;
              // For growth-column, match startsWith because it has query params ?familyId=xxx
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl font-medium text-lg ${
                    isActive ? 'bg-family-100 text-family-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            {/* 管理员菜单 */}
            {user.is_admin === 1 && (
              <div className="pt-4 border-t border-gray-200 mt-4">
                <p className="text-xs text-gray-500 font-semibold mb-2 px-3">管理员功能</p>
                {adminNavigation.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl font-medium text-lg ${
                        isActive ? 'bg-red-100 text-red-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
            {/* 登出按钮 */}
            <div className="pt-4 border-t border-gray-200 mt-4 mb-6">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-3 rounded-xl font-medium text-lg text-red-700 hover:bg-red-50 w-full"
              >
                <LogOut className="h-6 w-6" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - 动态设置列数，根据启用插件数量 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 h-20">
        <div
          className={`grid h-full ${
            totalItems === 5 ? 'grid-cols-5' : totalItems === 6 ? 'grid-cols-6' : totalItems === 7 ? 'grid-cols-7' : 'grid-cols-5'
          }`}
        >
          {bottomNavigation.map(item => {
            const Icon = item.icon;
            // For growth-column, match startsWith because it has query params ?familyId=xxx
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            // 底部导航空间小，成長專欄缩写为 書籤
            const displayName = item.name === '成長專欄' ? t('growth_column_short') : item.name;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 ${isActive ? 'text-family-500' : 'text-gray-500'}`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold truncate px-1">{displayName}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Padding */}
      <div className="h-20 lg:hidden" />

      {/* Version Badge */}
      <VersionBadge />
    </div>
  );
}
