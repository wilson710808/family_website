'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Bot, Plus, Trash2, Brain, MessageSquare, Settings } from 'lucide-react';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';
import LargeInput from '@/components/LargeInput';
import LargeTextarea from '@/components/LargeTextarea';

interface Memory {
  id: number;
  family_id: number;
  category: string;
  content: string;
  created_by_name: string;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

const CATEGORIES = [
  { value: 'general', label: '一般資訊', icon: '📝' },
  { value: 'birthday', label: '生日', icon: '🎂' },
  { value: 'preference', label: '偏好', icon: '💝' },
  { value: 'habit', label: '習慣', icon: '🔄' },
  { value: 'important', label: '重要事件', icon: '⭐' },
  { value: 'health', label: '健康', icon: '🏥' },
];

function ButlerPageContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<User | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('general');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  // 获取当前用户
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' });
        }
      })
      .catch(() => {
        setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' });
      });
  }, []);

  // 获取记忆列表
  useEffect(() => {
    if (!familyId) return;
    loadMemories();
  }, [familyId]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plugins/butler/memories?familyId=${familyId}`);
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories);
      }
    } catch (error) {
      console.error('加载记忆失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newContent.trim() || !familyId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/plugins/butler/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: Number(familyId),
          category: newCategory,
          content: newContent.trim(),
        }),
      });

      if (res.ok) {
        setNewContent('');
        setShowAddForm(false);
        loadMemories();
      }
    } catch (error) {
      console.error('添加记忆失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (id: number) => {
    if (!confirm('確定要刪除這條記憶嗎？')) return;

    try {
      const res = await fetch(`/api/plugins/butler/memories?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadMemories();
      }
    } catch (error) {
      console.error('删除记忆失败:', error);
    }
  };

  if (!familyId) {
    return (
      <Layout user={user || { id: 0, name: '', avatar: '' }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Bot className="h-24 w-24 text-blue-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">請選擇家族</h2>
            <p className="text-gray-500 mb-6">請從家族頁面進入管家設置</p>
            <a
              href="/families"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              前往家族頁面
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  const getCategoryLabel = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  const getCategoryIcon = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.icon || '📝';
  };

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">🤖 家族管家設置</h1>
              <p className="text-blue-100 mt-1 text-lg">管理管家記憶，讓管家更了解你的家族</p>
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">管家能記住什麼？</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <div key={cat.value} className="bg-white rounded-lg p-3 text-center">
                <span className="text-2xl">{cat.icon}</span>
                <span className="block text-gray-700 mt-1">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 添加记忆按钮 */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">管家記憶庫</h2>
          <ElderFriendlyButton
            variant="primary"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            添加記憶
          </ElderFriendlyButton>
        </div>

        {/* 记忆列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : memories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">還沒有任何記憶</h3>
            <p className="text-gray-500 mb-6">添加一些家族資訊，讓管家更了解你們！</p>
            <ElderFriendlyButton variant="primary" onClick={() => setShowAddForm(true)}>
              <Plus className="h-5 w-5 mr-2" />
              添加第一條記憶
            </ElderFriendlyButton>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{getCategoryIcon(memory.category)}</span>
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {getCategoryLabel(memory.category)}
                      </span>
                    </div>
                    <p className="text-lg text-gray-800">{memory.content}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      {memory.created_by_name} · {new Date(memory.created_at).toLocaleString('zh-TW')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(memory.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 添加记忆弹窗 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">添加管家記憶</h3>

              <div className="space-y-5">
                {/* 类别选择 */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">類別</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setNewCategory(cat.value)}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          newCategory === cat.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="block text-sm mt-1">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 内容输入 */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">內容</label>
                  <LargeTextarea
                    value={newContent}
                    onChange={(value: string) => setNewContent(value)}
                    placeholder="例如：爸爸喜歡喝茶、媽媽的生日是 3 月 15 日..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <ElderFriendlyButton
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  取消
                </ElderFriendlyButton>
                <ElderFriendlyButton
                  variant="primary"
                  onClick={handleAddMemory}
                  disabled={!newContent.trim() || saving}
                  className="flex-1"
                >
                  {saving ? '保存中...' : '保存'}
                </ElderFriendlyButton>
              </div>
            </div>
          </div>
        )}

        {/* 快速测试 */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            <MessageSquare className="h-6 w-6 inline mr-2" />
            測試管家
          </h3>
          <p className="text-gray-600 mb-4">在聊天室中輸入以下內容測試管家：</p>
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 text-gray-700">"@管家，你好！" → 管家會打招呼</div>
            <div className="bg-white rounded-lg p-3 text-gray-700">"@管家，今天天氣如何？" → 管家會回答</div>
            <div className="bg-white rounded-lg p-3 text-gray-700">"早安！" → 管家會問候</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ButlerPage() {
  return (
    <ButlerPageContent />
  );
}
