'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        // 登录成功，跳转到仪表板
        router.push('/dashboard');
      } else {
        setError(data.error || t('login_failed'));
      }
    } catch (err) {
      setError(t('network_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-bold text-gray-900">
          {t('login')}
        </h2>
        <p className="mt-2 text-center text-xl text-gray-600">
          {t('welcome_back_to_family')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xl font-medium text-gray-700 mb-3">
                {t('email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-family-500 focus:border-family-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xl font-medium text-gray-700 mb-3">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-family-500 focus:border-family-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Demo account info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-lg font-semibold text-blue-800 mb-2">{t('demo_account')}</p>
              <p className="text-base text-blue-700">{t('demo_email')}</p>
              <p className="text-base text-blue-700">{t('demo_password')}</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xl text-red-600">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-lg text-xl font-medium text-white bg-family-500 hover:bg-family-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-family-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('loading') : t('login')}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </button>
            </div>

            {/* Register link */}
            <div className="text-center pt-4">
              <p className="text-xl text-gray-600">
                {t('no_account_yet')}{' '}
                <Link href="/register" className="font-medium text-family-600 hover:text-family-500">
                  {t('create_account')}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
