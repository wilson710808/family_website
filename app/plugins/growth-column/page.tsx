'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, BookOpen, Heart, History, Star, Trash2, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { isEnabled } from '../../../plugins/growth-column';

interface BookGuide {
  title: string;
  author: string;
  category: string;
  rating: number;
  summary: string;
  keyPoints: string[];
  inspiration: string;
  quotes: string[];
  readingTime: string;
  difficulty: string;
}

interface HistoryItem {
  id: number;
  book_name: string;
  author: string;
  category: string;
  created_at: string;
}

interface FavoriteItem {
  id: number;
  book_name: string;
  author: string;
  category: string;
  created_at: string;
  status?: number; // 0=未读, 1=已读
}

interface User {
  id: number;
  name: string;
  avatar: string;
  is_admin?: number;
}

const quickBooks = ['原子習慣', '被討厭的勇氣', '思考快與慢', '富爸爸窮爸爸', '影響力'];
const categories = ['全部', '自我成長', '商業', '歷史', '心理學', '小說', '科技'];

function GrowthColumnContent() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [bookName, setBookName] = useState('');
  const [result, setResult] = useState<BookGuide | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'favorites'>('search');
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [isFavorite, setIsFavorite] = useState(false);

  // 获取url参数
  const [familyId, setFamilyId] = useState<number>(1);

  // 获取familyId from url after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = Number(params.get('familyId')) || 1;
      setFamilyId(id);
    }
  }, []);

  // 获取当前用户信息
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

    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (enabled && user) {
      fetchHistory();
      fetchFavorites();
    }
  }, [familyId, enabled, user]);

  async function checkHealth() {
    try {
      const res = await fetch(`/api/plugins/growth-column/health`);
      if (res.status === 404) {
        setEnabled(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      console.log('Growth column health:', data);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`/api/plugins/growth-column/history?familyId=${familyId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }

  async function fetchFavorites() {
    try {
      const res = await fetch(`/api/plugins/growth-column/favorites?familyId=${familyId}`);
      const data = await res.json();
      if (data.success) {
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  }

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!bookName.trim()) return;

    setIsSearching(true);
    setResult(null);

    try {
      const res = await fetch(`/api/plugins/growth-column/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookName: bookName.trim(), familyId })
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        // 检查是否已收藏
        const fav = favorites.find(f => f.book_name === data.data.title);
        setIsFavorite(!!fav);
        await fetchHistory();
      } else {
        alert(data.message || '搜索失败');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('搜索失败，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  }

  async function toggleFavorite() {
    if (!result) return;

    try {
      const res = await fetch(`/api/plugins/growth-column/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          bookName: result.title,
          author: result.author,
          category: result.category
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsFavorite(data.action === 'added');
        await fetchFavorites();
      }
    } catch (error) {
      console.error('Toggle favorite failed:', error);
      alert('操作失败');
    }
  }

  function handleShare() {
    if (!result) return;
    // Copy current page url to clipboard
    const shareUrl = window.location.href;
    const shareTitle = `${result.title} - 成長專欄導讀`;
    const shareText = `${shareTitle}\n\n${shareUrl}`;

    if (navigator.share) {
      // Use Web Share API if available
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch(() => {
        // User cancelled, fallback to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
          alert('分享鏈接已復製到剪貼板！');
        }).catch(() => {
          alert('分享鏈接：\n' + shareUrl);
        });
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('分享鏈接已復製到剪貼板！');
      }).catch(() => {
        alert('分享鏈接：\n' + shareUrl);
      });
    }
  }

  async function toggleReadStatus(item: FavoriteItem) {
    try {
      const newStatus = item.status === 1 ? 0 : 1;
      const res = await fetch(`/api/plugins/growth-column/favorites`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus })
      });

      const data = await res.json();
      if (data.success) {
        await fetchFavorites();
      }
    } catch (error) {
      console.error('Toggle read status failed:', error);
      alert('操作失败');
    }
  }

  function loadFromHistory(item: HistoryItem) {
    setBookName(item.book_name);
    handleSearch();
    setActiveTab('search');
  }

  function renderRating(rating: number) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  }

  // Always render inside Layout to ensure bottom navigation is included
  const defaultUser = { id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' };
  const currentUser = user || defaultUser;
  // Ensure avatar is never empty string to avoid console warning
  if (!currentUser.avatar) {
    currentUser.avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin';
  }

  // Filter by category
  const filteredHistory = filterCategory === '全部'
    ? history
    : history.filter(item => item.category === filterCategory);

  const filteredFavorites = filterCategory === '全部'
    ? favorites
    : favorites.filter(item => item.category === filterCategory);

  if (!enabled) {
    return (
      <Layout user={currentUser}>
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">成长专栏插件未启用</h2>
            <p className="text-yellow-600">该插件已被禁用，请在环境变量中设置 PLUGIN_GROWTH_COLUMN=true 启用。</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout user={currentUser}>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-pulse">加载中...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout user={currentUser}>
        <div className="space-y-6">
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-xl text-gray-500 ml-4">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href={`/?familyId=${familyId}`} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-2 text-purple-500" />
              成长专栏
            </h1>
            <p className="text-gray-600 mt-1">AI智能书籍导读，和家族成员一起成长</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'search' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Search className="w-4 h-4" />
            搜索
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <History className="w-4 h-4" />
            历史
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Heart className="w-4 h-4" />
            收藏
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Box */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={bookName}
                  onChange={e => setBookName(e.target.value)}
                  placeholder="输入书名，探索AI导读..."
                  className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <button
                  type="submit"
                  disabled={isSearching || !bookName.trim()}
                  className="bg-purple-500 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg hover:bg-purple-600 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {isSearching ? '搜索中...' : '搜索'}
                </button>
              </form>

              {/* Quick Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {quickBooks.map(b => (
                  <button
                    key={b}
                    onClick={() => {
                      setBookName(b);
                      handleSearch();
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 rounded-full text-sm transition-colors"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {isSearching && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">AI正在生成导讀...</p>
              </div>
            )}

            {/* Result */}
            {result && !isSearching && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-400 text-white p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{result.title}</h2>
                      <p className="mt-1 opacity-90">{result.author}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="px-2 py-1 bg-white/20 rounded text-xs">{result.category}</span>
                        <span className="text-sm">{result.readingTime}</span>
                        <span className="text-sm">{result.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {renderRating(result.rating)}
                      <div className="flex gap-2">
                        <button
                          onClick={toggleFavorite}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isFavorite ? 'bg-red-400 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
                          {isFavorite ? '已收藏' : '收藏'}
                        </button>
                        <button
                          onClick={handleShare}
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-white/20 text-white hover:bg-white/30"
                        >
                          <Share2 className="w-4 h-4" />
                          分享
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">內容簡介</h3>
                    <p className="text-gray-700 leading-relaxed text-base">{result.summary}</p>
                  </div>

                  {/* Key Points */}
                  <div>
                    <h3 className="text-sm font-semibold text-purple-600 mb-3 uppercase tracking-wide">核心觀點</h3>
                    <ul className="space-y-3">
                      {result.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex gap-3 items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700 pt-0.5 text-base">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Inspiration */}
                  <div>
                    <h3 className="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">讀後啟發</h3>
                    <p className="text-gray-700 leading-relaxed text-base">{result.inspiration}</p>
                  </div>

                  {/* Quotes */}
                  {result.quotes && result.quotes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-purple-600 mb-3 uppercase tracking-wide">書中金句</h3>
                      <div className="space-y-2">
                        {result.quotes.map((quote, idx) => (
                          <blockquote key={idx} className="pl-4 border-l-4 border-purple-200 italic text-gray-600 text-base">
                            {quote}
                          </blockquote>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">阅读历史 ({filteredHistory.length}/{history.length})</h3>
              </div>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterCategory === cat
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>暂无阅读历史{filterCategory !== '全部' ? ` - ${filterCategory}` : ''}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredHistory.map(item => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{item.book_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {item.author && <span className="text-sm text-gray-500">{item.author}</span>}
                          {item.category && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">我的收藏 ({filteredFavorites.length}/{favorites.length})</h3>
              </div>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterCategory === cat
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {filteredFavorites.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>还没有收藏任何书籍{filterCategory !== '全部' ? ` - ${filterCategory}` : ''}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredFavorites.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 hover:bg-gray-50 ${item.status === 1 ? 'bg-green-50' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="cursor-pointer flex-1" onClick={() => {
                        setBookName(item.book_name);
                        handleSearch();
                        setActiveTab('search');
                      }}>
                        <h4 className="font-medium flex items-center gap-2">
                          {item.book_name}
                          {item.status === 1 && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              已讀
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {item.author && <span className="text-sm text-gray-500">{item.author}</span>}
                          {item.category && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleReadStatus(item)}
                          className={`p-2 rounded-lg ${
                            item.status === 1 
                              ? 'text-yellow-600 hover:bg-yellow-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={item.status === 1 ? '標記為未讀' : '標記為已讀'}
                        >
                          {item.status === 1 ? (
                            <span className="text-xs font-medium">↺</span>
                          ) : (
                            <span className="text-xs font-medium">✓</span>
                          )}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/plugins/growth-column/favorites?id=${item.id}`, {
                                method: 'DELETE'
                              });
                              await fetchFavorites();
                            } catch (error) {
                              console.error('Delete failed:', error);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          📚 成长专栏插件 · 基于 AI 生成的智能书籍导读 · 可插拔设计
        </div>
      </div>
    </Layout>
  );
}

export default function GrowthColumnPage() {
  return (
    <Suspense fallback={
      <Layout user={{ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' }}>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl text-gray-500">加载中...</p>
        </div>
      </Layout>
    }>
      <GrowthColumnContent />
    </Suspense>
  );
}
