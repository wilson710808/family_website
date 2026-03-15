'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, User, Mail, Lock, ArrowRight, Hash, Search } from 'lucide-react';
import LargeInput from '@/components/LargeInput';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

// 预设头像列表
const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family7',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family8',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=family9',
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    avatar: AVATARS[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

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
          avatar: formData.avatar,
          referralCode: formData.referralCode.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 注册成功，设置cookie并跳转到首页
        document.cookie = `auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        window.location.href = '/dashboard';
      } else {
        setError(data.error || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const selectAvatar = (avatar: string) => {
    setFormData(prev => ({ ...prev, avatar }));
    setShowAvatarSelector(false);
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
            {/* Avatar Selection */}
            <div className="text-center">
              <p className="text-xl font-medium text-gray-700 mb-4">选择您的头像</p>
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  className="p-2 rounded-full border-4 border-family-200 hover:border-family-400 transition-colors"
                >
                  <img
                    src={formData.avatar}
                    alt="用户头像"
                    className="w-24 h-24 rounded-full"
                  />
                </button>
                {showAvatarSelector && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 z-50 w-80">
                    <p className="text-sm font-medium text-gray-700 mb-3">点击选择头像：</p>
                    <div className="grid grid-cols-3 gap-3">
                      {AVATARS.map((avatar, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectAvatar(avatar)}
                          className={`p-1 rounded-full transition-all ${
                            formData.avatar === avatar
                              ? 'ring-4 ring-family-500 bg-family-100'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <img src={avatar} alt={`头像${index + 1}`} className="w-16 h-16 rounded-full" />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAvatarSelector(false)}
                      className="mt-3 w-full py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                    >
                      关闭
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">点击头像可以更换哦</p>
            </div>

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

            <LargeInput
              label="推荐码（可选）"
              type="text"
              value={formData.referralCode}
              onChange={(value) => setFormData(prev => ({ ...prev, referralCode: value }))}
              placeholder="如果有家人给您推荐码，请输入在这里"
              icon={<Hash className="h-7 w-7" />}
              helperText="输入推荐码可以直接加入对应的家族"
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
