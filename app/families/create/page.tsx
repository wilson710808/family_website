'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, FileText, Plus } from 'lucide-react';
import LargeInput from '@/components/LargeInput';
import LargeTextarea from '@/components/LargeTextarea';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

export default function CreateFamilyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/families/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/families');
      } else {
        setError(data.error || '创建失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link href="/families" className="mr-4 p-3 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-7 w-7 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">创建新家族</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 text-lg font-medium">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <LargeInput
              label="家族名称"
              type="text"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="请输入家族名称，例如：快乐一家人"
              required
              maxLength={50}
              icon={<Users className="h-7 w-7" />}
            />

            <LargeTextarea
              label="家族描述"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="简单介绍一下这个家族吧，例如：我们是一个温暖的大家庭..."
              rows={4}
              maxLength={200}
            />

            <div className="pt-4">
              <ElderFriendlyButton
                type="submit"
                disabled={loading || !formData.name.trim()}
                fullWidth
                size="lg"
              >
                <span className="flex items-center justify-center">
                  <Plus className="h-6 w-6 mr-2" />
                  {loading ? '创建中...' : '创建家族'}
                </span>
              </ElderFriendlyButton>
            </div>
          </form>

          <div className="mt-10 p-8 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">创建家族后您可以：</h3>
            <ul className="space-y-4 text-xl text-gray-600">
              <li className="flex items-start">
                <svg className="h-7 w-7 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                邀请家人加入，共同管理家族空间
              </li>
              <li className="flex items-start">
                <svg className="h-7 w-7 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                发布家族公告，通知重要事项
              </li>
              <li className="flex items-start">
                <svg className="h-7 w-7 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                使用留言板记录生活点滴
              </li>
              <li className="flex items-start">
                <svg className="h-7 w-7 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                和家族成员实时在线聊天
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
