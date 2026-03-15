'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, User, Mail, Lock, ArrowRight } from 'lucide-react';
import LargeInput from '@/components/LargeInput';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 登录成功，设置cookie
        document.cookie = `auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        router.push('/dashboard');
      } else {
        setError(data.error || '注册失败');
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

      {/* Register Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">创建账号</h1>
            <p className="text-xl text-gray-600">加入我们，开启家族专属空间</p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 text-lg font-medium">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <LargeInput
              label="姓名"
              type="text"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="请输入您的姓名"
              required
              icon={<User className="h-7 w-7" />}
            />

            <LargeInput
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
              placeholder="请输入您的邮箱"
              required
              icon={<Mail className="h-7 w-7" />}
              helperText="我们不会向您发送垃圾邮件"
            />

            <LargeInput
              label="密码"
              type="password"
              value={formData.password}
              onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
              placeholder="请输入密码（至少6位）"
              required
              minLength={6}
              icon={<Lock className="h-7 w-7" />}
              helperText="请牢记您的密码"
            />

            <LargeInput
              label="确认密码"
              type="password"
              value={formData.confirmPassword}
              onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
              placeholder="请再次输入密码"
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
                {loading ? '注册中...' : '注册'}
                {!loading && <ArrowRight className="h-6 w-6 ml-3" />}
              </span>
            </ElderFriendlyButton>
          </form>

          <div className="mt-8 text-center text-lg text-gray-600">
            已有账号？
            <Link href="/login" className="text-family-600 hover:text-family-700 font-bold ml-2">
              立即登录
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
