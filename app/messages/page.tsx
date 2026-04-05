'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { MessageSquare, Plus, Clock, User, Send, Trash2 } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  user_name: string;
  user_avatar: string;
  created_at: string;
  family_name: string;
  user_id: number;
}

interface User {
  id: number;
  name: string;
  avatar: string;
  is_admin?: number;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 获取当前用户信息
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

    // 加载留言列表
    loadMessages();
  }, [familyId]);

  useEffect(() => {
    // 新消息添加后滚动到底部
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const url = familyId 
        ? `/api/plugins/message-board/messages?familyId=${familyId}` 
        : '/api/messages?familyId=' + familyId;
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
      // 尝试插件API，失败回退到老API
      let url = '/api/plugins/message-board/messages/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          familyId: parseInt(familyId),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        await loadMessages();
      } else {
        // 回退到老API
        const res2 = await fetch('/api/messages/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage,
            familyId: parseInt(familyId),
          }),
        });
        const data2 = await res2.json();
        if (data2.success) {
          setNewMessage('');
          await loadMessages();
        } else {
          alert(data2.message || '发送失败');
        }
      }
    } catch (error) {
      console.error('发送留言失败:', error);
      alert('发送失败，请稍后重试');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('确定要删除这条留言吗？')) {
      return;
    }

    setDeletingId(messageId);
    try {
      const res = await fetch(`/api/plugins/message-board/messages/delete?id=${messageId}&familyId=${familyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await loadMessages();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除留言失败:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setDeletingId(null);
    }
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        {/* 只有自己能删除 */}
                        {user && message.user_id === user.id && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={deletingId === message.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除留言"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暫無留言，快來發表第一條留言吧！</p>
            </div>
          )}
        </div>

        {/* Send Message Form */}
        {familyId && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4 flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="寫下你的留言..."
                required
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="flex items-center justify-center px-6 py-3 bg-green-500 disabled:bg-gray-300 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
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
