'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Cake, Calendar, MessageSquare, Megaphone, Clock, AlertCircle } from 'lucide-react';

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
}

interface NotificationBellProps {
  userId: number;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  birthday: <Cake className="w-5 h-5 text-pink-500" />,
  event: <Calendar className="w-5 h-5 text-blue-500" />,
  message: <MessageSquare className="w-5 h-5 text-green-500" />,
  announcement: <Megaphone className="w-5 h-5 text-orange-500" />,
  reminder: <Clock className="w-5 h-5 text-purple-500" />,
  system: <AlertCircle className="w-5 h-5 text-gray-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  birthday: '生日',
  event: '活動',
  message: '消息',
  announcement: '公告',
  reminder: '提醒',
  system: '系統',
};

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, userId }),
      });
      fetchNotifications();
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
        body: JSON.stringify({ userId, markAll: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('标记全部已读失败:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="relative">
      {/* 通知按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉面板 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 通知面板 */}
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-xl border z-50 max-h-[80vh] overflow-hidden">
            {/* 標題欄 */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">通知中心</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4" />
                    全部已讀
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* 通知列表 */}
            <div className="overflow-y-auto max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>暫無通知</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        notification.is_read ? 'bg-white' : 'bg-blue-50'
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* 類型圖標 */}
                        <div className="flex-shrink-0 mt-1">
                          {TYPE_ICONS[notification.type] || TYPE_ICONS.system}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {TYPE_LABELS[notification.type] || '系統'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </p>
                          {notification.content && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                          )}
                        </div>

                        {/* 未讀標記 */}
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 查看更多 */}
            {notifications.length >= 20 && (
              <div className="p-3 border-t text-center">
                <a
                  href="/notifications"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  查看全部通知
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
