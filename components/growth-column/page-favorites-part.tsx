'use client';

import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface BookGuide {
  title: string;
  author: string;
  category: string;
  rating: number;
  summary: string;
  keyPoints: string[];
  inspiration: string;
  practicalExamples: Array<{scenario: string; advice: string}>;
  quotes: string[];
  readingTime: string;
  difficulty: string;
}

interface FavoriteItem {
  id: number;
  book_name: string;
  author: string;
  category: string;
  created_at: string;
  status?: number;
  full_guide?: string;
}

interface PageFavoritesPartProps {
  activeTab: string;
  favorites: FavoriteItem[];
  filterCategory: string;
  setBookName: (name: string) => void;
  handleSearch: () => void;
  setResult: (result: BookGuide) => void;
  setIsSearching: (loading: boolean) => void;
  setIsFavorite: (favorite: boolean) => void;
  setActiveTab: (tab: 'search' | 'history' | 'favorites') => void;
  toggleReadStatus: (item: FavoriteItem) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  familyId: number;
}

const categories = ['全部', '自我成長', '商業', '歷史', '心理學', '小說', '科技'];

export default function PageFavoritesPart({
  activeTab,
  favorites,
  filterCategory,
  setBookName,
  handleSearch,
  setResult,
  setIsSearching,
  setIsFavorite,
  setActiveTab,
  toggleReadStatus,
  fetchFavorites,
  familyId
}: PageFavoritesPartProps) {
  const [loadingCacheId, setLoadingCacheId] = useState<number | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<BookGuide | null>(null);
  const filteredFavorites = filterCategory === '全部'
    ? favorites
    : favorites.filter(item => item.category === filterCategory);

  if (activeTab !== 'favorites') return null;

  // 如果已经选中了要显示的导览，直接在收藏页显示
  if (selectedGuide) {
    function renderRating(rating: number) {
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          ))}
          <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* 返回收藏列表按钮 */}
        <button
          onClick={() => setSelectedGuide(null)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回收藏列表
        </button>

        {/* 导览内容卡片 - 和搜索页相同的样式 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-400 text-white p-6">
            <div className="flex gap-6 items-start">
              {/* Book Cover Image */}
              <div className="flex-shrink-0">
                <img
                  src={`https://covers.openlibrary.org/b/title/${encodeURIComponent(selectedGuide.title)}-M.jpg`}
                  alt={selectedGuide.title}
                  className="w-32 h-48 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    // 如果找不到封面，用占位图
                    (e.target as HTMLImageElement).src = `https://placehold.co/128x192/eeeeee/999999?text=${encodeURIComponent(selectedGuide.title)}`;
                  }}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{selectedGuide.title}</h2>
                <p className="mt-1 opacity-90">{selectedGuide.author}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="px-2 py-1 bg-white/20 rounded text-xs">{selectedGuide.category}</span>
                  <span className="text-sm">{selectedGuide.readingTime}</span>
                  <span className="text-sm">{selectedGuide.difficulty}</span>
                </div>
                <div className="flex flex-col items-start gap-2 mt-4">
                  {renderRating(selectedGuide.rating)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">內容簡介</h3>
              <p className="text-gray-700 leading-relaxed text-base">{selectedGuide.summary}</p>
            </div>

            {/* Key Points */}
            <div>
              <h3 className="text-sm font-semibold text-purple-600 mb-3 uppercase tracking-wide">核心觀點</h3>
              <ul className="space-y-3">
                {selectedGuide.keyPoints.map((point, idx) => (
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
              <p className="text-gray-700 leading-relaxed text-base">{selectedGuide.inspiration}</p>
            </div>

            {/* Quotes */}
            {selectedGuide.quotes && selectedGuide.quotes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-purple-600 mb-3 uppercase tracking-wide">書中金句</h3>
                <div className="space-y-2">
                  {selectedGuide.quotes.map((quote, idx) => (
                    <blockquote key={idx} className="pl-4 border-l-4 border-purple-200 italic text-gray-600 text-base">
                      {quote}
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* 實際生活應用範例 */}
            {selectedGuide.practicalExamples && selectedGuide.practicalExamples.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-purple-600 mb-3 uppercase tracking-wide">實際生活應用範例</h3>
                <div className="space-y-4">
                  {selectedGuide.practicalExamples.map((example, idx) => (
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
      </div>
    );
  }

  // 收藏列表视图
  async function loadFromFavoriteCache(item: FavoriteItem) {
    setLoadingCacheId(item.id);
    setIsSearching(true);
    setIsFavorite(true);

    try {
      // 尝试从API读取缓存的导览
      const res = await fetch(`/api/plugins/growth-column/favorite-guide?id=${item.id}&familyId=${familyId}`);
      const data = await res.json();

      if (data.success && data.data) {
        // 直接在当前收藏页显示，不需要跳转到搜索标签
        console.log(`[GrowthColumn] 从缓存加载导览，在收藏页直接显示: ${item.book_name}`);
        setSelectedGuide(data.data);
        setLoadingCacheId(null);
        setIsSearching(false);
        return;
      }

      // 缓存未命中，需要重新生成（跳转到搜索页）
      console.log(`[GrowthColumn] 缓存未命中，跳转到搜索页重新生成: ${item.book_name}`);
      setBookName(item.book_name);
      handleSearch();
      setActiveTab('search');
      setLoadingCacheId(null);
    } catch (error) {
      console.error('从缓存加载失败:', error);
      // 出错跳转到搜索页
      setBookName(item.book_name);
      handleSearch();
      setActiveTab('search');
      setLoadingCacheId(null);
      setIsSearching(false);
    }
  }

  return (
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
              onClick={() => {
                // filterCategory is set in parent component
                // This is just for rendering the filter buttons here
                // The actual state change is handled by the parent
                const parentSetFilter = (window as any).__growthColumnSetFilterCategory;
                if (typeof parentSetFilter === 'function') {
                  parentSetFilter(cat);
                }
              }}
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
                <div className="cursor-pointer flex-1" onClick={() => loadFromFavoriteCache(item)}>
                  <h4 className="font-medium flex items-center gap-2">
                    {item.book_name}
                    {loadingCacheId === item.id && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full animate-pulse">
                        讀取中...
                      </span>
                    )}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReadStatus(item);
                    }}
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
                    onClick={async (e) => {
                      e.stopPropagation();
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
  );
}
