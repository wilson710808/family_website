'use client';

import { Brain, Bot, Calendar, TreePine, TrendingUp, Folder } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const PLUGINS = [
  {
    id: 'butler',
    name: '家族管家',
    icon: <Bot className="h-8 w-8" />,
    description: 'AI 智能管家，記住家族的重要資訊',
    color: 'blue',
    href: '/plugins/butler',
  },
  {
    id: 'documents',
    name: '文檔庫',
    icon: <Folder className="h-8 w-8" />,
    description: '家族文件上傳與分享',
    color: 'yellow',
    href: '/plugins/documents',
  },
  {
    id: 'birthday',
    name: '生日提醒',
    icon: <Calendar className="h-8 w-8" />,
    description: '生日、紀念日提醒',
    color: 'pink',
    href: '/plugins/birthday',
  },
  {
    id: 'album',
    name: '家族相冊',
    icon: <Brain className="h-8 w-8" />,
    description: '照片分享、點贊評論',
    color: 'green',
    href: '/plugins/album',
  },
  {
    id: 'growth',
    name: '成長專欄',
    icon: <TreePine className="h-8 w-8" />,
    description: 'AI 書籍導讀',
    color: 'purple',
    href: '/plugins/growth-column',
  },
  {
    id: 'calendar',
    name: '家族日曆',
    icon: <Calendar className="h-8 w-8" />,
    description: '事件日曆、生日、紀念日',
    color: 'blue',
    href: '/plugins/calendar',
  },
  {
    id: 'tree',
    name: '家族樹',
    icon: <TreePine className="h-8 w-8" />,
    description: '記錄家族血脈傳承',
    color: 'green',
    href: '/plugins/tree',
  },
  {
    id: 'stock',
    name: '投資助手',
    icon: <TrendingUp className="h-8 w-8" />,
    description: 'StockAI 美股分析',
    color: 'orange',
    href: '/plugins/stock',
  },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
};

function PluginsPageContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">功能中心</h1>
          <p className="text-gray-500 mt-2">選擇你想使用的功能</p>
        </div>

        {/* 插件网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLUGINS.map((plugin) => {
            const colors = COLOR_CLASSES[plugin.color];
            const href = `${plugin.href}?familyId=${familyId}`;
            return (
              <Link
                key={plugin.id}
                href={href}
                className={`block bg-white rounded-xl shadow-sm p-6 border-2 transition-all hover:shadow-md hover:border-gray-300 ${colors.border}`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
                    {plugin.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{plugin.name}</h3>
                    <p className="text-gray-500 mt-1">{plugin.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PluginsPage() {
  return <PluginsPageContent />;
}
