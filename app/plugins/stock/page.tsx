'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { TrendingUp, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { getStockAIDomain } from '@/plugins/stock-assistant';

interface User {
  id: number;
  name: string;
  avatar: string;
}

function StockPageContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockAIDomain, setStockAIDomain] = useState('');
  const [retryCount, setRetryCount] = useState(0);

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

  useEffect(() => {
    // 从后端获取 StockAI 地址
    fetch('/api/plugins/stock/config')
      .then(res => res.json())
      .then(data => {
        if (data.domain) {
          setStockAIDomain(data.domain);
        } else {
          setStockAIDomain('http://192.168.2.72:3001');
        }
        setLoading(false);
      })
      .catch(() => {
        setStockAIDomain('http://192.168.2.72:3001');
        setLoading(false);
      });
  }, []);

  const handleRefresh = () => {
    setRetryCount(c => c + 1);
    setError(null);
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📈 投資助手</h1>
                <p className="text-orange-100 mt-1">StockAI 美股分析服務</p>
              </div>
            </div>
            <a
              href={stockAIDomain}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              新視窗打開
            </a>
          </div>
        </div>

        {/* 嵌入 StockAI */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-sm text-gray-500 ml-2">{stockAIDomain}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="刷新"
            >
              <RefreshCw className={`h-5 w-5 ${retryCount > 0 ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="h-[70vh] bg-white">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">載入中...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">無法連接 StockAI</h3>
                  <p className="text-gray-500 mb-6">{error}</p>
                  <div className="space-y-3">
                    <a
                      href={stockAIDomain}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-center"
                    >
                      在新視窗打開
                    </a>
                    <button
                      onClick={handleRefresh}
                      className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      重試
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                key={retryCount}
                src={stockAIDomain}
                className="w-full h-full border-0"
                title="StockAI 投資助手"
                onLoad={() => setError(null)}
                onError={() => setError('無法載入 StockAI，請確認服務正在運行')}
              />
            )}
          </div>
        </div>

        {/* 功能说明 */}
        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
          <h3 className="text-xl font-semibold text-orange-900 mb-4">📊 StockAI 功能</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <span className="text-2xl">📈</span>
              <p className="text-gray-700 mt-2">實時股價</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <span className="text-2xl">📊</span>
              <p className="text-gray-700 mt-2">K線圖</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <span className="text-2xl">🤖</span>
              <p className="text-gray-700 mt-2">AI 分析</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <span className="text-2xl">💰</span>
              <p className="text-gray-700 mt-2">模擬下單</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <span className="text-2xl">⭐</span>
              <p className="text-gray-700 mt-2">自選股</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <span className="text-2xl">💬</span>
              <p className="text-gray-700 mt-2">智能問答</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function StockPage() {
  return <StockPageContent />;
}
