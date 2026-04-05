'use client';

import Link from 'next/link';
import { Home, Users, MessageSquare, Bell, LogIn, UserPlus } from 'lucide-react';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';
import { useI18n } from '@/lib/i18n';

export default function HomePageClient() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-family-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Home className="h-10 w-10 text-family-500" />
            <h1 className="text-3xl font-bold text-family-800">{t('family_center')}</h1>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="hidden md:flex items-center px-6 py-3 text-family-600 hover:text-family-700 font-semibold text-xl"
            >
              <LogIn className="h-6 w-6 mr-2" />
              {t('login')}
            </Link>
            <Link
              href="/register"
              className="hidden md:flex items-center px-6 py-3 bg-family-500 text-white rounded-xl hover:bg-family-600 font-semibold text-xl transition-colors"
            >
              <UserPlus className="h-6 w-6 mr-2" />
              {t('register')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
            {t('welcome_to_family_space')}
          </h2>
          <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('connect_family_members')}
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-family-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-family-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('family_group')}</h3>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t('create_family_group')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-family-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-10 w-10 text-family-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('announcement_board')}</h3>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t('publish_family_announcements')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-family-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-family-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('instant_chat')}</h3>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t('real_time_chat')}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-family-500 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-6">{t('join_family_community')}</h3>
            <p className="text-xl text-family-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('simple_steps_create_space')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/register" className="w-full sm:w-auto">
                <ElderFriendlyButton variant="primary" size="lg" fullWidth className="bg-white text-family-600 hover:bg-gray-50">
                  {t('free_register')}
                </ElderFriendlyButton>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <ElderFriendlyButton variant="primary" size="lg" fullWidth className="bg-family-600 border border-family-400 hover:bg-family-700">
                  {t('have_account_login')}
                </ElderFriendlyButton>
              </Link>
            </div>
          </div>

          {/* Mobile CTA Buttons */}
          <div className="md:hidden mt-8 space-y-4">
            <Link href="/login" className="block">
              <ElderFriendlyButton variant="secondary" fullWidth>
                <span className="flex items-center justify-center">
                  <LogIn className="h-6 w-6 mr-2" />
                  {t('login')}
                </span>
              </ElderFriendlyButton>
            </Link>
            <Link href="/register" className="block">
              <ElderFriendlyButton variant="primary" fullWidth>
                <span className="flex items-center justify-center">
                  <UserPlus className="h-6 w-6 mr-2" />
                  {t('register')}
                </span>
              </ElderFriendlyButton>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl text-gray-500">{t('copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
