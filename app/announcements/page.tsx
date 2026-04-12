'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Bell, Plus, Clock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

interface Family {
  id: number;
  name: string;
}

function AnnouncementsContent() {
  const searchParams = useSearchParams();
  const urlFamilyId = searchParams.get('familyId');
  
  const [user, setUser] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(urlFamilyId || '');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    // 获取用户信息
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser({ id: 1, name: '系统管理员', avatar: '' });
        }
      })
      .catch(() => {
        setUser({ id: 1, name: '系统管理员', avatar: '' });
      });

    // 获取用户的家族列表
    fetch('/api/families')
      .then(res => res.json())
      .then(data => {
        if (data.families && data.families.length > 0) {
          const approved = data.families.filter((f: any) => f.status === 'approved');
          setFamilies(approved);
          if (!selectedFamilyId && approved.length > 0) {
            setSelectedFamilyId(String(approved[0].id));
          }
        }
      })
      .catch(console.error);
  }, [selectedFamilyId]);

  useEffect(() => {
    if (selectedFamilyId) {
      loadAnnouncements();
    }
  }, [selectedFamilyId]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/announcements?familyId=${selectedFamilyId}`);
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('加载公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !selectedFamilyId) {
      alert('请填写完整信息');
      return;
    }

    try {
      const res = await fetch('/api/announcements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          familyId: selectedFamilyId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFormData({ title: '', content: '' });
        loadAnnouncements();
        alert('公告发布成功！');
      } else {
        alert('发布失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('发布公告失败:', error);
      alert('发布失败，请重试');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/families">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">公告欄</h1>
            </div>
          </div>
          {selectedFamilyId && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-5 h-5" />
              發布公告
            </button>
          )}
        </div>

        {/* Family Selector */}
        {families.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {families.map(family => (
              <button
                key={family.id}
                onClick={() => setSelectedFamilyId(String(family.id))}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedFamilyId === String(family.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {family.name}
              </button>
            ))}
          </div>
        )}

        {/* No Family Warning */}
        {families.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">您還沒有加入任何家族，請先加入家族後再發布公告</p>
            <Link href="/families" className="text-blue-500 underline mt-2 inline-block">
              前往家族頁面
            </Link>
          </div>
        )}

        {/* Publish Form */}
        {showForm && selectedFamilyId && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">發布新公告</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公告標題 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="請輸入公告標題"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公告內容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={5}
                  placeholder="請輸入公告內容"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  發布
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900">{a.title}</h3>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{a.content}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {a.user_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(a.created_at).toLocaleString('zh-TW')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : selectedFamilyId ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>暫無公告</p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

export default function AnnouncementsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <AnnouncementsContent />
    </Suspense>
  );
}
