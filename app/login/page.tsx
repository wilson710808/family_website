'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Mail, Lock, ArrowRight } from 'lucide-react';
import LargeInput from '@/components/LargeInput';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // 登录成功，设置cookie
        document.cookie = `auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        router.push('/dashboard');
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-family-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Home className="h-8 w-8 text-family-500" />
            <span className="text-2xl font-bold text-family-800">家族中心</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">欢迎回来</h1>
            <p className="text-xl text-gray-600">登录您的账号，进入家族空间</p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 text-lg font-medium">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <LargeInput
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
              placeholder="请输入您的邮箱"
              required
              icon={<Mail className="h-7 w-7" />}
            />

            <LargeInput
              label="密码"
              type="password"
              value={formData.password}
              onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
              placeholder="请输入密码"
              required
              minLength={6}
              icon={<Lock className="h-7 w-7" />}
            />

            <ElderFriendlyButton
              type="submit"
              disabled={loading}
              fullWidth
              size="lg"
            >
              <span className="flex items-center justify-center">
                {loading ? '登录中...' : '登录'}
                {!loading && <ArrowRight className="h-6 w-6 ml-3" />}
              </span>
            </ElderFriendlyButton>
          </form>

          <div className="mt-8 text-center text-lg text-gray-600">
            还没有账号？
            <Link href="/register" className="text-family-600 hover:text-family-700 font-bold ml-2">
              立即注册
            </Link>
          </div>

          {/* Demo Account Info */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
            <p className="text-lg text-gray-800 mb-3 font-bold">📋 测试账号：</p>
            <p className="text-base text-gray-600 mb-1">邮箱: admin@family.com</p>
            <p className="text-base text-gray-600">密码: admin123456</p>
          </div>
        </div>
      </main>
    </div>
  );
}
