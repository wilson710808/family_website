'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Bell, MessageSquare, Settings, LogOut, Menu, X } from 'lucide-react';
import ElderFriendlyButton from './ElderFriendlyButton';

interface LayoutProps {
  children: ReactNode;
  user: {
    id: number;
    name: string;
    avatar: string;
  };
}

export default function Layout({ children, user }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  const navigation = [
    { name: '首页', href: '/dashboard', icon: Home },
    { name: '家族', href: '/families', icon: Users },
    { name: '公告', href: '/announcements', icon: Bell },
    { name: '留言板', href: '/messages', icon: MessageSquare },
    { name: '聊天', href: '/chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Home className="h-8 w-8 text-family-500" />
            <span className="text-2xl font-bold text-family-800">家族中心</span>
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
              <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
              <div>
                <p className="text-xl font-semibold text-gray-900">{user.name}</p>
                <p className="text-lg text-gray-500">欢迎回来</p>
              </div>
            </div>

            <nav className="space-y-3">
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
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
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <ElderFriendlyButton
                onClick={handleLogout}
                variant="danger"
                fullWidth
                size="lg"
              >
                <span className="flex items-center justify-center">
                  <LogOut className="h-6 w-6 mr-2" />
                  退出登录
                </span>
              </ElderFriendlyButton>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:flex-col lg:bg-white lg:shadow-lg">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-200">
          <Home className="h-10 w-10 text-family-500" />
          <h1 className="text-2xl font-bold text-family-800">家族中心</h1>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto p-6">
          <div className="flex items-center space-x-4 mb-8 p-4 bg-family-50 rounded-xl">
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
            <div>
              <p className="text-xl font-semibold text-gray-900">{user.name}</p>
              <p className="text-base text-gray-500">欢迎回来</p>
            </div>
          </div>

          <nav className="space-y-3 flex-1">
            {navigation.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
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
          </nav>

          <ElderFriendlyButton
            onClick={handleLogout}
            variant="danger"
            fullWidth
            size="lg"
            className="mt-6"
          >
            <span className="flex items-center justify-center">
              <LogOut className="h-6 w-6 mr-2" />
              退出登录
            </span>
          </ElderFriendlyButton>
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
        <div className="grid grid-cols-5 h-full">
          {navigation.slice(0, 5).map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  isActive ? 'text-family-500' : 'text-gray-500'
                }`}
              >
                <Icon className="h-7 w-7" />
                <span className="text-sm font-semibold">{item.name}</span>
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
