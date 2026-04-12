'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Layout from '@/components/Layout';
import {
  Home, Users, MessageSquare, Bell, Calendar, Settings,
  ChevronRight, Star, Crown, User, Megaphone, Clock,
  Cake, Event, BookOpen, Bot, TrendingUp
} from 'lucide-react';

interface Member {
  id: number;
  name: string;
  avatar: string;
  role: string;
  relation_title: string;
  contribution_points: number;
}

interface Props {
  user: { id: number; name: string; avatar: string };
  families: { id: number; name: string }[];
  currentFamilyId: number;
  data: {
    family: any;
    members: Member[];
    announcements: any[];
    messages: any[];
    upcomingEvents: any[];
    upcomingBirthdays: any[];
    unreadCount: number;
  };
}

export default function FamilyPortalClient({ user, families, currentFamilyId, data }: Props) {
  const [activeSection, setActiveSection] = useState('overview');

  const quickActions = [
    { id: 'chat', label: '家族聊天', icon: <MessageSquare className="w-6 h-6" />, href: `/families/${currentFamilyId}/chat`, color: 'blue' },
    { id: 'butler', label: '家族管家', icon: <Bot className="w-6 h-6" />, href: `/plugins/butler?familyId=${currentFamilyId}`, color: 'purple' },
    { id: 'calendar', label: '家族日曆', icon: <Calendar className="w-6 h-6" />, href: `/plugins/calendar?familyId=${currentFamilyId}`, color: 'green' },
    { id: 'stats', label: '統計面板', icon: <TrendingUp className="w-6 h-6" />, href: `/plugins/stats?familyId=${currentFamilyId}`, color: 'orange' },
  ];

  return (
    <Layout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{data.family?.name || '家族門戶'}</h1>
              <p className="text-blue-100 mt-1">
                {data.members?.length || 0} 位成員 · {data.announcements?.length || 0} 條公告
              </p>
            </div>
            <div className="flex items-center gap-2">
              {data.unreadCount > 0 && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {data.unreadCount} 條未讀
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {quickActions.map(action => (
              <Link
                key={action.id}
                href={action.href}
                className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-center transition-colors"
              >
                <div className="flex justify-center mb-2">{action.icon}</div>
                <p className="text-sm font-medium">{action.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Members */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              家族成員
            </h2>
            <div className="space-y-3">
              {data.members?.slice(0, 8).map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      {member.name}
                      {member.role === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                    </p>
                    <p className="text-sm text-gray-500">{member.relation_title || '成員'}</p>
                  </div>
                  {member.contribution_points > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">{member.contribution_points}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {data.members?.length > 8 && (
              <Link href={`/families/${currentFamilyId}/members`} className="block text-center text-blue-500 mt-4 text-sm">
                查看全部 {data.members.length} 位成員
              </Link>
            )}
          </div>

          {/* Middle Column - Announcements & Messages */}
          <div className="space-y-6">
            {/* Announcements */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                最新公告
              </h2>
              {data.announcements?.length > 0 ? (
                <div className="space-y-3">
                  {data.announcements.slice(0, 3).map((a: any) => (
                    <div key={a.id} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-gray-900">{a.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {a.author_name} · {new Date(a.created_at).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暫無公告</p>
              )}
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                最新消息
              </h2>
              {data.messages?.length > 0 ? (
                <div className="space-y-3">
                  {data.messages.slice(0, 5).map((m: any) => (
                    <div key={m.id} className="flex items-start gap-2">
                      <img src={m.author_avatar} alt="" className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">{m.author_name}</span>
                          <span className="text-gray-600 ml-2">{m.content?.substring(0, 50)}...</span>
                        </p>
                        <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString('zh-TW')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暫無消息</p>
              )}
              <Link href={`/families/${currentFamilyId}/chat`} className="block text-center text-blue-500 mt-4 text-sm">
                前往聊天室 <ChevronRight className="w-4 h-4 inline" />
              </Link>
            </div>
          </div>

          {/* Right Column - Events & Birthdays */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                即將到來
              </h2>
              {data.upcomingEvents?.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingEvents.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <Event className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">{e.title}</p>
                        <p className="text-sm text-gray-500">{new Date(e.start_time).toLocaleDateString('zh-TW')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暫無活動</p>
              )}
            </div>

            {/* Upcoming Birthdays */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Cake className="w-5 h-5" />
                即將生日
              </h2>
              {data.upcomingBirthdays?.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingBirthdays.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-3 p-2 bg-pink-50 rounded-lg">
                      <img src={b.avatar} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-medium text-gray-900">{b.name}</p>
                        <p className="text-sm text-pink-500">{new Date(b.next_birthday).toLocaleDateString('zh-TW')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暫無生日提醒</p>
              )}
            </div>

            {/* Links */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">快速訪問</h2>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/plugins/tree?familyId=${currentFamilyId}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                  <p className="text-sm">家族樹</p>
                </Link>
                <Link href={`/plugins/album?familyId=${currentFamilyId}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                  <p className="text-sm">家族相冊</p>
                </Link>
                <Link href={`/plugins/growth-social?familyId=${currentFamilyId}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                  <p className="text-sm">家族書房</p>
                </Link>
                <Link href={`/plugins/documents?familyId=${currentFamilyId}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                  <p className="text-sm">文檔庫</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
