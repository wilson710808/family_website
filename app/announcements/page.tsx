'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Bell, Plus, Clock, User } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  user_name: string;
  created_at: string;
  family_name: string;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

function AnnouncementsContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', familyId: familyId || '' });

  useEffect(() => {
    // 获取当前用户信息 - 开发模式：如果返回 null，使用默认管理员
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          // 如果没有获取到用户，使用默认管理员
          setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' });
        }
      })
      .catch(() => {
        // 出错也使用默认管理员
        setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' });
      });

    // 加载公告列表
    loadAnnouncements();
  }, [familyId]);

  const loadAnnouncements = async () => {
    try {
      const url = familyId ? `/api/announcements?familyId=${familyId}` : '/api/announcements';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('加载公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.familyId) return;

    try {
      const res = await fetch('/api/announcements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFormData({ title: '', content: '', familyId: familyId || '' });
        loadAnnouncements();
      }
    } catch (error) {
      console.error('发布公告失败:', error);
    }
  };

  // 如果还没加载完用户，显示加载中
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-xl text-gray-500 ml-4">加载中...</p>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="h-8 w-8 mr-2 text-blue-500" />
            公告栏
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            发布公告
          </button>
        </div>

        {/* Publish Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">发布新公告</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公告标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="请输入公告标题"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公告内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  placeholder="请输入公告内容"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                >
                  发布公告
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : announcements.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {announcements.map(announcement => (
                <div key={announcement.id} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(announcement.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{announcement.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>发布者：{announcement.user_name}</span>
                    </div>
                    {!familyId && (
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                        {announcement.family_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无公告</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function AnnouncementsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">加载中...</p>
    </div>}>
      <AnnouncementsContent />
    </Suspense>
  );
}
