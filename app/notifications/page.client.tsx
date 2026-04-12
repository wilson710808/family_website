'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  Bell, Cake, Calendar, MessageSquare, Megaphone, Clock, AlertCircle,
  CheckCheck, Trash2, ArrowLeft, Filter
} from 'lucide-react';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

interface Notification {
  id: number;
  family_id: number;
  user_id: number;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: number;
  created_at: string;
  read_at: string | null;
  family_name?: string;
}

interface NotificationsClientProps {
  user: { id: number; name: string; avatar: string };
  initialNotifications: Notification[];
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  birthday: { icon: <Cake className="w-5 h-5" />, color: 'pink', label: '生日' },
  event: { icon: <Calendar className="w-5 h-5" />, color: 'blue', label: '活動' },
  message: { icon: <MessageSquare className="w-5 h-5" />, color: 'green', label: '消息' },
  announcement: { icon: <Megaphone className="w-5 h-5" />, color: 'orange', label: '公告' },
  reminder: { icon: <Clock className="w-5 h-5" />, color: 'purple', label: '提醒' },
  system: { icon: <AlertCircle className="w-5 h-5" />, color: 'gray', label: '系統' },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

export default function NotificationsClient({ user, initialNotifications }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read === 1) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, userId: user.id }),
      });

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: 1 } : n
        )
      );
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, markAll: true }),
      });

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: 1 }))
      );
    } catch (error) {
      console.error('标记全部已读失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    if (!confirm('確定要刪除這條通知嗎？')) return;

    try {
      await fetch(`/api/notifications/read?notificationId=${notificationId}&userId=${user.id}`, {
        method: 'DELETE',
      });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-TW');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.is_read === 0) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">通知中心</h1>
              <p className="text-gray-500 mt-1">
                共 {notifications.length} 條通知，{unreadCount} 條未讀
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <ElderFriendlyButton
              variant="secondary"
              size="md"
              onClick={markAllAsRead}
              disabled={loading}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              全部已讀
            </ElderFriendlyButton>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">篩選：</span>
            </div>
            
            {/* 已读/未读筛选 */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                未讀 ({unreadCount})
              </button>
            </div>

            {/* 类型筛选 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部類型
              </button>
              {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === type
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {filter === 'unread' ? '沒有未讀通知' : '沒有通知'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? '所有通知都已讀取'
                : '當您有新通知時，會顯示在這裡'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y">
              {filteredNotifications.map(notification => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
                const colors = COLOR_CLASSES[config.color] || COLOR_CLASSES.gray;

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.is_read === 0 ? 'bg-blue-50/50' : 'bg-white'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg}`}
                      >
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                          >
                            {config.label}
                          </span>
                          {notification.family_name && (
                            <span className="text-xs text-gray-400">
                              {notification.family_name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>

                        <p className="font-medium text-gray-900">
                          {notification.title}
                        </p>

                        {notification.content && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notification.is_read === 0 && (
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 py-4">
          通知系統 · 保留最近 100 條通知
        </div>
      </div>
    </Layout>
  );
}
