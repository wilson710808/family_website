'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, BookOpen, Heart, History, Star, ArrowLeft, Share2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PageFavoritesPart from '@/components/growth-column/page-favorites-part';
import { isEnabled } from '../../../plugins/growth-column/index.client';

interface PracticalExample {
  scenario: string;
  advice: string;
}

interface BookGuide {
  title: string;
  author: string;
  category: string;
  rating: number;
  summary: string;
  keyPoints: string[];
  inspiration: string;
  practicalExamples: PracticalExample[];
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

// 热门推荐书籍库 - 30本不重复推荐
const recommendedBooks = [
  '原子習慣', '被討厭的勇氣', '思考快與慢', '富爸爸窮爸爸', '影響力',
  '高效能人士的七個習慣', '微習慣', '關於這件事你對了，我錯了', '關於未來', '斜槓青年',
  '刻意練習', '深度工作', '心流', '快樂宣言', '情緒調整理論',
  '關鍵對話', '非暴力溝通', '關鍵改變', '掌控習慣', '自我改變的心理學',
  '讓品格長成力量', '終身成長', '學習這件事', '如何閱讀一本書', '記憶術',
  '思考的藝術', '邏輯思考', '批判性思維', '創造性思維', '高效閱讀'
];

// 获取今天推荐的5本书索引 - 基于日期计算，每天凌晨3点切换
function getTodayRandomQuickBooks(): number[] {
  const now = new Date();
  // 调整到凌晨3点作为切换点，每天得到不同的随机种子
  const day = Math.floor((now.getTime() - 3 * 60 * 60 * 1000) / (1000 * 60 * 60 * 24));
  
  // 使用日期作为随机种子生成5个不重复的索引
  const indices = recommendedBooks.map((_, idx) => idx);
  
  // 简单的伪随机打乱（基于日期种子）
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor((day * (i + 1)) % (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // 取前5个
  return indices.slice(0, 5);
}

// 记录已经推荐过的书籍索引，确保全局不重复
let usedRecommendations: Set<number> = new Set();

// 获取N个不重复的随机推荐
function getNUniqueRandomRecommendations(count: number): string[] {
  // 如果剩余可用书籍不够N本，清空重新开始
  const availableIndices = recommendedBooks
    .map((_, idx) => idx)
    .filter(idx => !usedRecommendations.has(idx));
  
  if (availableIndices.length < count) {
    usedRecommendations.clear();
    availableIndices.splice(0, 0, ...recommendedBooks.map((_, idx) => idx));
  }
  
  // Fisher-Yates 打乱
  for (let i = availableIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
  }
  
  // 取前count个，标记为已使用
  const selected = availableIndices.slice(0, count);
  selected.forEach(idx => usedRecommendations.add(idx));
  
  return selected.map(idx => recommendedBooks[idx]);
}

// 获取今日快速推荐列表（基于日期，每天更新5本）
function getTodayQuickBooks(): string[] {
  const todayIndices = getTodayRandomQuickBooks();
  return todayIndices.map(idx => recommendedBooks[idx]);
}

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
  // 每日凌晨3点自动更新5本，每次点击AI推荐重新生成5本，保证不重复
  // 从localStorage读取用户AI推荐过的书单，如果没有就使用每日默认推荐
  const getInitialQuickBooks = (): string[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('growth_column_quick_books');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 5) {
            return parsed;
          }
        } catch (e) {
          // ignore invalid saved data
        }
      }
    }
    return getTodayQuickBooks();
  };
  const [quickBooks, setQuickBooks] = useState<string[]>(getInitialQuickBooks());

  // 场景推荐相关状态
  const [userScenario, setUserScenario] = useState<string>('');
  const [scenarioRecommendLoading, setScenarioRecommendLoading] = useState<boolean>(false);
  const [scenarioRecommends, setScenarioRecommends] = useState<Array<{bookName: string; reason: string}>>([]);

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
      console.log('Fetching favorites for familyId:', familyId);
      const res = await fetch(`/api/plugins/growth-column/favorites?familyId=${familyId}`);
      const data = await res.json();
      console.log('Favorites response:', data);
      if (data.success) {
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  }

  async function handleSearch(e?: React.FormEvent, forceRegenerate: boolean = true) {
    if (e) e.preventDefault();
    if (!bookName.trim()) return;

    setIsSearching(true);
    setResult(null);

    try {
      const res = await fetch(`/api/plugins/growth-column/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookName: bookName.trim(), 
          familyId,
          userId: user?.id,
          forceRegenerate // 用户主动点击搜索时强制重新生成，覆盖缓存
        })
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        // 检查是否已收藏
        const fav = favorites.find(f => f.book_name === data.data.title);
        setIsFavorite(!!fav);
        if (data.fromCache) {
          console.log(`[GrowthColumn] 从全局缓存读取导览: ${bookName.trim()}`);
        }
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
      console.log('Toggle favorite for:', result.title, 'userId:', user?.id, 'familyId:', familyId);
      const res = await fetch(`/api/plugins/growth-column/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          userId: user?.id,
          bookName: result.title,
          author: result.author,
          category: result.category
        })
      });

      const data = await res.json();
      console.log('Toggle favorite response:', data);
      if (data.success) {
        setIsFavorite(data.action === 'added');
        await fetchFavorites();
        if (data.action === 'added') {
          alert('已添加到收藏');
        } else {
          alert('已取消收藏');
        }
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('Toggle favorite failed:', error);
      alert('操作失败：' + (error as Error).message);
    }
  }

  function handleShare() {
    if (!result) return;
    // Copy current page url to clipboard
    const shareUrl = window.location.href;
    const shareTitle = `${result.title} - 成長專欄導讀`;
    const shareText = `${shareTitle}\n\n${shareUrl}`;

    // Show the link directly to user as fallback
    const showLinkAlert = () => {
      alert('分享鏈接：\n' + shareUrl);
    };

    if (navigator.share) {
      // Use Web Share API if available
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch((error) => {
        // User cancelled or share failed, fallback to clipboard
        console.log('Web Share failed:', error);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareText).then(() => {
            alert('分享鏈接已復製到剪貼板！');
          }).catch((clipError) => {
            console.log('Clipboard failed:', clipError);
            showLinkAlert();
          });
        } else {
          showLinkAlert();
        }
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('分享鏈接已復製到剪貼板！');
      }).catch((clipError) => {
        console.log('Clipboard failed:', clipError);
        showLinkAlert();
      });
    } else {
      // No clipboard API available, just show the link
      showLinkAlert();
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

  // 根据用户场景推荐书籍
  async function handleScenarioRecommend() {
    if (!userScenario.trim()) {
      alert('請描述你目前的困擾或場景，例如：「我無法堅持養成習慣，推薦適合的書」');
      return;
    }

    setScenarioRecommendLoading(true);

    try {
      const res = await fetch(`/api/plugins/growth-column/scenario-recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: userScenario.trim(), familyId })
      });

      const data = await res.json();
      if (data.success && data.recommendations) {
        setScenarioRecommends(data.recommendations);
      } else {
        alert(data.message || '推薦失敗，請重試');
      }
    } catch (error) {
      console.error('Scenario recommendation failed:', error);
      alert('推薦失敗，請稍後重試');
    } finally {
      setScenarioRecommendLoading(false);
    }
  }

  // 点击场景推荐的书名，直接搜索生成导览
  function handleScenarioBookClick(bookName: string) {
    setBookName(bookName);
    handleSearch();
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
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">成長專欄插件未啟用</h2>
            <p className="text-yellow-600">該插件已被禁用，請在環境變量中設置 PLUGIN_GROWTH_COLUMN=true 啟用。</p>
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
              成長專欄
            </h1>
            <p className="text-gray-600 mt-1">AI智能書籍導讀，和家族成員一起成長</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'search' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Search className="w-4 h-4" />
            搜尋
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <History className="w-4 h-4" />
            歷史
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
                  placeholder="輸入書名，探索AI導讀..."
                  className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <button
                  type="submit"
                  disabled={isSearching || !bookName.trim()}
                  className="bg-purple-500 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg hover:bg-purple-600 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {isSearching ? '搜尋中...' : '搜尋'}
                </button>
              </form>

              {/* 场景推荐 - 根据用户困扰推荐书籍 */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  根據你的困擾推薦書籍
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userScenario}
                    onChange={e => setUserScenario(e.target.value)}
                    placeholder="描述你的困扰或场景，例如：我无法坚持养成习惯..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
                  />
                  <button
                    onClick={handleScenarioRecommend}
                    disabled={scenarioRecommendLoading || !userScenario.trim()}
                    className="bg-purple-100 disabled:bg-gray-300 disabled:text-gray-500 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 whitespace-nowrap text-sm flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${scenarioRecommendLoading ? 'animate-spin' : ''}`} />
                    {scenarioRecommendLoading ? '推薦中...' : 'AI推薦'}
                  </button>
                </div>

                {/* 场景推荐结果 */}
                {scenarioRecommends.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {scenarioRecommends.map((rec, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleScenarioBookClick(rec.bookName)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{rec.bookName}</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">点击生成导览</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Tags */}
              <div className="mt-4 flex flex-wrap gap-2 items-center">
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
                <button
                  onClick={() => {
                    // 生成5本全新的不重复推荐，替换整个书单
                    const newQuickBooks = getNUniqueRandomRecommendations(5);
                    setQuickBooks(newQuickBooks);
                    // 保存到localStorage，刷新页面后保持这次推荐
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('growth_column_quick_books', JSON.stringify(newQuickBooks));
                    }
                    // 用户可以从新生成的5本中点击选择，这里不自动搜索
                    setBookName('');
                    setResult(null);
                  }}
                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm transition-colors flex items-center gap-1"
                  title="AI推薦熱門書單"
                >
                  <RefreshCw className="w-4 h-4" />
                  AI推薦
                </button>
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
                  <div className="flex gap-6 items-start">
                    {/* Book Cover Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={`https://covers.openlibrary.org/b/title/${encodeURIComponent(result.title)}-M.jpg`}
                        alt={result.title}
                        className="w-32 h-48 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          // 如果找不到封面，用占位图
                          (e.target as HTMLImageElement).src = `https://placehold.co/128x192/eeeeee/999999?text=${encodeURIComponent(result.title)}`;
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{result.title}</h2>
                      <p className="mt-1 opacity-90">{result.author}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="px-2 py-1 bg-white/20 rounded text-xs">{result.category}</span>
                        <span className="text-sm">{result.readingTime}</span>
                        <span className="text-sm">{result.difficulty}</span>
                      </div>
                      <div className="flex flex-col items-start gap-2 mt-4">
                        {renderRating(result.rating)}
                        <div className="flex gap-2 mt-2">
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

                  {/* 實際生活應用範例 */}
                  {result.practicalExamples && result.practicalExamples.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-purple-600 mb-3 uppercase tracking-wide">實際生活應用範例</h3>
                      <div className="space-y-4">
                        {result.practicalExamples.map((example, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4">
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                場景 {idx + 1}
                              </span>
                            </div>
                            <p className="text-gray-800 font-medium mb-2">{example.scenario}</p>
                            <div className="pl-3 border-l-2 border-purple-200">
                              <p className="text-gray-700 text-base">{example.advice}</p>
                            </div>
                          </div>
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
                <h3 className="font-semibold">閱讀歷史 ({filteredHistory.length}/{history.length})</h3>
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
                <p>暫無閱讀歷史{filterCategory !== '全部' ? ` - ${filterCategory}` : ''}</p>
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
        <PageFavoritesPart
          activeTab={activeTab}
          favorites={favorites}
          filterCategory={filterCategory}
          setBookName={setBookName}
          handleSearch={handleSearch}
          setResult={setResult}
          setIsSearching={setIsSearching}
          setIsFavorite={setIsFavorite}
          setActiveTab={setActiveTab}
          toggleReadStatus={toggleReadStatus}
          fetchFavorites={fetchFavorites}
          familyId={familyId}
        />


        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          📚 成長專欄插件 · 基於 AI 生成的智能書籍導讀 · 可插拔設計
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
