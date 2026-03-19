'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { MessageSquare, Plus, Clock, User, Send } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  user_name: string;
  user_avatar: string;
  created_at: string;
  family_name: string;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

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

    // 加载留言列表
    loadMessages();
  }, [familyId]);

  const loadMessages = async () => {
    try {
      const url = familyId ? `/api/messages?familyId=${familyId}` : '/api/messages';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('加载留言失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !familyId) return;

    try {
      const res = await fetch('/api/messages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          familyId: familyId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        loadMessages();
      }
    } catch (error) {
      console.error('发送留言失败:', error);
    }
  };

  // 如果还没加载完用户，显示加载中
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="text-xl text-gray-500 ml-4">加载中...</p>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="h-8 w-8 mr-2 text-green-500" />
            留言板
          </h1>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : messages.length > 0 ? (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {messages.map(message => (
                <div key={message.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={message.user_avatar} 
                      alt={message.user_name} 
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{message.user_name}</span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(message.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        {!familyId && (
                          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                            {message.family_name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 break-words">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无留言，快来发表第一条留言吧！</p>
            </div>
          )}
        </div>

        {/* Send Message Form */}
        {familyId && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="写下你的留言..."
                required
              />
              <button
                type="submit"
                className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
              >
                <Send className="h-5 w-5 mr-2" />
                发送
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">加载中...</p>
    </div>}>
      <MessagesContent />
    </Suspense>
  );
}
