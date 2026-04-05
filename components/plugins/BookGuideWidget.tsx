'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { isEnabled } from '../../plugins/growth-column/index.client';
import Link from 'next/link';

interface RecentBook {
  id: number;
  book_name: string;
  author: string;
  category: string;
  created_at: string;
}

interface BookGuideWidgetProps {
  familyId: number;
  maxItems?: number;
}

export default function BookGuideWidget({ familyId, maxItems = 5 }: BookGuideWidgetProps) {
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [pluginEnabled, setPluginEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchRecent();
    }
  }, [familyId]);

  // 检查插件是否启用
  useEffect(() => {
    setPluginEnabled(isEnabled());
  }, []);

  async function fetchRecent() {
    try {
      const res = await fetch(`/api/plugins/growth-column/history?familyId=${familyId}`);
      const data = await res.json();

      if (res.status === 404) {
        setPluginEnabled(false);
        setLoading(false);
        return;
      }

      if (data.success) {
        setRecentBooks(data.history.slice(0, maxItems));
      }
    } catch (error) {
      console.error('[BookGuideWidget] Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!pluginEnabled || recentBooks.length === 0) {
    return null; // 插件禁用或者没有最近阅读，不显示组件
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-500" />
          最近閱讀
        </h3>
        <Link
          href={`/plugins/growth-column?familyId=${familyId}`}
          className="text-sm text-blue-500 hover:underline"
        >
          成長專欄 →
        </Link>
      </div>

      <div className="space-y-2">
        {recentBooks.map(book => (
          <Link
            key={book.id}
            href={`/plugins/growth-column?familyId=${familyId}`}
            className="block hover:bg-gray-50 rounded px-2 py-1.5 -mx-2"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{book.book_name}</div>
              <Search className="w-3 h-3 text-gray-400" />
            </div>
            {book.author && (
              <div className="text-xs text-gray-500">{book.author}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
