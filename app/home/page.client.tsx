'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Bell, MessageSquare, Plus, Calendar, Clock, Grid,
  Cake, BookOpen, Star, Heart, TrendingUp, Zap, Bot,
  CheckCircle, AlertCircle, Home as HomeIcon
} from 'lucide-react';
import Layout from '@/components/Layout';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';
import { useI18n } from '@/lib/i18n';

interface PersonalHomeClientProps {
  user: any;
  approvedFamilies: any[];
  pendingInvitations: any[];
  stats: {
    totalFamilies: number;
    totalMessages: number;
    totalAnnouncements: number;
    upcomingBirthdays: number;
    upcomingEvents: number;
    unreadNotifications: number;
    growthBooksRead: number;
    growthBooksFavorited: number;
  };
  recentActivities: any[];
  upcomingItems: {
    birthdays: any[];
    events: any[];
  };
}

export default function PersonalHomeClient({
  user,
  approvedFamilies,
  pendingInvitations,
  stats,
  recentActivities,
  upcomingItems,
}: PersonalHomeClientProps) {
  const { t } = useI18n();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 每分钟更新
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return '夜深了，注意休息 🌙';
    if (hour < 12) return '早安，美好的一天開始了 ☀️';
    if (hour < 14) return '午安，記得午餐時間 🍱';
    if (hour < 18) return '午安，繼續加油 💪';
    if (hour < 22) return '晚安，辛苦了一天 🌆';
    return '夜深了，早點休息 🌙';
  };

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* 个人欢迎卡片 */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {getGreeting()}
                </h1>
                <p className="text-2xl text-white/90 mb-4">
                  {user.name}，歡迎回來！
                </p>
                <p className="text-lg text-white/80">
                  {currentTime.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </p>
              </div>
              <div className="hidden md:block">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full border-4 border-white/30 shadow-xl"
                />
              </div>
            </div>

            {/* 快捷入口 */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/plugins/growth-column?familyId=1">
                <ElderFriendlyButton variant="primary" size="md" className="bg-white/20 border border-white/30 hover:bg-white/30">
                  <BookOpen className="h-5 w-5 mr-2" />
                  成長專欄
                </ElderFriendlyButton>
              </Link>
              <Link href="/plugins/butler?familyId=1">
                <ElderFriendlyButton variant="primary" size="md" className="bg-white/20 border border-white/30 hover:bg-white/30">
                  <Bot className="h-5 w-5 mr-2" />
                  家族管家
                </ElderFriendlyButton>
              </Link>
              <Link href="/plugins/tree?familyId=1">
                <ElderFriendlyButton variant="primary" size="md" className="bg-white/20 border border-white/30 hover:bg-white/30">
                  <HomeIcon className="h-5 w-5 mr-2" />
                  家族樹
                </ElderFriendlyButton>
              </Link>
              <Link href="/plugins">
                <ElderFriendlyButton variant="primary" size="md" className="bg-white/20 border border-white/30 hover:bg-white/30">
                  <Grid className="h-5 w-5 mr-2" />
                  功能中心
                </ElderFriendlyButton>
              </Link>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/families" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFamilies}</p>
                <p className="text-sm text-gray-500">我的家族</p>
              </div>
            </div>
          </Link>

          <Link href="/notifications" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center relative">
                <Bell className="h-6 w-6 text-red-600" />
                {stats.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.unreadNotifications}
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadNotifications}</p>
                <p className="text-sm text-gray-500">未讀通知</p>
              </div>
            </div>
          </Link>

          <Link href="/plugins/growth-column?familyId=1" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.growthBooksRead}</p>
                <p className="text-sm text-gray-500">已讀書籍</p>
              </div>
            </div>
          </Link>

          <Link href="/plugins/calendar?familyId=1" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                <p className="text-sm text-gray-500">即將到來</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 待处理邀请 */}
        {pendingInvitations.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <h3 className="text-xl font-semibold text-orange-900">待處理邀請</h3>
            </div>
            <div className="space-y-3">
              {pendingInvitations.map(inv => (
                <div key={`inv-${inv.id}`} className="flex items-center justify-between bg-white rounded-lg p-4">
                  <div>
                    <p className="font-medium text-gray-900">{inv.name}</p>
                    <p className="text-sm text-gray-500">邀請你加入家族</p>
                  </div>
                  <Link
                    href={`/families/${inv.id}`}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    查看
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 双栏布局：即将到来 + 我的活动 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 即将到来的生日 */}
          {upcomingItems.birthdays.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-pink-50">
                <div className="flex items-center gap-2">
                  <Cake className="h-5 w-5 text-pink-600" />
                  <h3 className="font-semibold text-gray-900">即將到來的生日</h3>
                </div>
              </div>
              <div className="divide-y">
                {upcomingItems.birthdays.map((b: any) => (
                  <div key={`birthday-${b.id}`} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{b.name}</p>
                        <p className="text-sm text-gray-500">{b.family_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-pink-600">
                          {new Date(b.reminder_date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 text-center">
                <Link href="/plugins/birthday?familyId=1" className="text-sm text-pink-600 hover:text-pink-700">
                  查看全部生日提醒 →
                </Link>
              </div>
            </div>
          )}

          {/* 即将到来的事件 */}
          {upcomingItems.events.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-blue-50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">即將到來的事件</h3>
                </div>
              </div>
              <div className="divide-y">
                {upcomingItems.events.map((e: any) => (
                  <div key={`event-${e.id}`} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{e.title}</p>
                        <p className="text-sm text-gray-500">{e.family_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">
                          {new Date(e.start_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 text-center">
                <Link href="/plugins/calendar?familyId=1" className="text-sm text-blue-600 hover:text-blue-700">
                  查看全部事件 →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 我的家族 */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">我的家族</h2>
            <Link href="/families" className="text-lg text-purple-600 hover:text-purple-700 font-medium">
              查看全部
            </Link>
          </div>

          {approvedFamilies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">還沒有加入任何家族</h3>
              <p className="text-gray-500 mb-6">創建或加入一個家族開始使用吧！</p>
              <Link href="/families/create">
                <ElderFriendlyButton variant="primary" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  創建家族
                </ElderFriendlyButton>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedFamilies.slice(0, 3).map(family => (
                <Link
                  key={family.id}
                  href={`/families/${family.id}`}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img src={family.avatar} alt={family.name} className="w-16 h-16 rounded-full" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{family.name}</h3>
                      <p className="text-sm text-gray-500">
                        {family.role === 'admin' ? '👑 管理員' : '👤 成員'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {family.description || '暫無描述'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 最近活动 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">最近動態</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {recentActivities.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>暫無動態</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentActivities.slice(0, 10).map((activity: any) => (

                  <div key={`${activity.type}-${activity.id}`} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'announcement' ? 'bg-blue-100' :
                        activity.type === 'event' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {activity.type === 'announcement' ? (
                          <Bell className="h-5 w-5 text-blue-600" />
                        ) : activity.type === 'event' ? (
                          <Calendar className="h-5 w-5 text-green-600" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900">
                          <span className="font-medium">{activity.user_name}</span>
                          <span className="text-gray-500 ml-2">
                            {activity.type === 'announcement' ? '發布了公告' :
                             activity.type === 'event' ? '創建了事件' : '發送了留言'}
                          </span>
                        </p>
                        <p className="text-gray-600 mt-1 truncate">
                          {activity.title || activity.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.created_at).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 成长专栏快捷入口 */}
        {stats.growthBooksRead > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  📚 我的閱讀進度
                </h3>
                <p className="text-gray-600">
                  已閱讀 <span className="font-medium text-purple-600">{stats.growthBooksRead}</span> 本書，
                  收藏 <span className="font-medium text-pink-600">{stats.growthBooksFavorited}</span> 本
                </p>
              </div>
              <Link
                href="/plugins/growth-column?familyId=1"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                繼續閱讀
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
