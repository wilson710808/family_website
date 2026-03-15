'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { MessageSquare, Send, Clock } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  user_id: number;
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

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 获取当前用户信息
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !familyId || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          familyId: familyId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        loadMessages();
      }
    } catch (error) {
      console.error('发布留言失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="h-8 w-8 mr-2 text-green-500" />
            留言板
          </h1>
        </div>

        {/* Message Input */}
        {familyId && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发表留言
                </label>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none"
                  placeholder="分享你的生活点滴、趣事、或者想说的话..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    {newMessage.length}/500 字
                  </p>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || submitting}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? '发布中...' : '发布留言'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Messages List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : messages.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {messages.map(message => (
                <div key={message.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={message.user_avatar}
                      alt={message.user_name}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{message.user_name}</p>
                        <span className="text-sm text-gray-500 flex items-center flex-shrink-0 ml-2">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(message.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {!familyId && (
                        <div className="mt-3">
                          <span className="inline-block bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                            {message.family_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无留言</p>
              {familyId && (
                <p className="text-gray-400 text-sm mt-2">成为第一个留言的人吧！</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
