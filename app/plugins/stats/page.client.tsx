'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  BarChart3, Users, MessageSquare, Calendar, Image, TrendingUp, 
  ArrowLeft, Star, Award, Crown, Zap
} from 'lucide-react';

interface Overview {
  totalMessages: number;
  totalAnnouncements: number;
  totalEvents: number;
  totalPhotos: number;
  memberCount: number;
}

interface ActivityDay {
  stat_date: string;
  message_count: number;
  active_members: number;
}

interface MemberRanking {
  id: number;
  name: string;
  avatar: string;
  contribution_points: number;
  contribution_stars: number;
  message_count: number;
  announcement_count: number;
}

interface Props {
  user: { id: number; name: string; avatar: string };
  families: { id: number; name: string }[];
  initialStats: {
    overview: Overview;
    activity: any[];
    ranking: any[];
  } | null;
  initialFamilyId: number | null;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function StatsClient({ user, families, initialStats, initialFamilyId }: Props) {
  const [selectedFamily, setSelectedFamily] = useState(initialFamilyId);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFamily) {
      loadStats(selectedFamily);
    }
  }, [selectedFamily]);

  const loadStats = async (familyId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plugins/stats?familyId=${familyId}&type=overview`);
      const overviewData = await res.json();

      const activityRes = await fetch(`/api/plugins/stats?familyId=${familyId}&type=activity&days=30`);
      const activityData = await activityRes.json();

      const rankingRes = await fetch(`/api/plugins/stats?familyId=${familyId}&type=ranking`);
      const rankingData = await rankingRes.json();

      if (overviewData.success && activityData.success && rankingData.success) {
        setStats({
          overview: overviewData.stats,
          activity: activityData.activity,
          ranking: rankingData.ranking,
        });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxMessageCount = () => {
    if (!stats?.activity || stats.activity.length === 0) return 100;
    return Math.max(...stats.activity.map(a => a.message_count), 1);
  };

  if (families.length === 0) {
    return (
      <Layout user={user}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">請先加入家族</h2>
            <p className="text-gray-500 mb-6">需要加入家族後才能查看統計數據</p>
            <Link href="/families" className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium">
              前往家族頁面
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/plugins">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 家族統計面板</h1>
              <p className="text-gray-500 mt-1">家族活躍度、貢獻排行、數據分析</p>
            </div>
          </div>
        </div>

        {/* Family Selector */}
        {families.length > 1 && (
          <div className="flex gap-2">
            {families.map(family => (
              <button
                key={family.id}
                onClick={() => setSelectedFamily(family.id)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedFamily === family.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {family.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : stats ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">總消息數</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overview.totalMessages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">公告數</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overview.totalAnnouncements}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">事件數</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overview.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                <div className="flex items-center gap-3">
                  <Image className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">照片數</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overview.totalPhotos}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-500">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">成員數</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overview.memberCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  最近 30 天活躍度
                </h3>
                <div className="h-48 flex items-end gap-1">
                  {stats.activity.length > 0 ? (
                    stats.activity.slice(-30).map((day, index) => {
                      const height = (day.message_count / getMaxMessageCount()) * 100;
                      return (
                        <div
                          key={day.stat_date}
                          className="flex-1 bg-blue-400 rounded-t hover:bg-blue-500 transition-colors group relative"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day.stat_date}: ${day.message_count} 條消息`}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                            {day.message_count} 條
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full text-center text-gray-400 flex items-center justify-center">
                      暂无数据
                    </div>
                  )}
                </div>
                {stats.activity.length > 0 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    总计 {stats.activity.reduce((sum, d) => sum + d.message_count, 0)} 条消息
                  </p>
                )}
              </div>

              {/* Ranking */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  貢獻排行榜
                </h3>
                {stats.ranking.length > 0 ? (
                  <div className="space-y-3">
                    {stats.ranking.slice(0, 5).map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-400' :
                            index === 1 ? 'bg-gray-300' :
                            index === 2 ? 'bg-orange-400' : 'bg-gray-200'
                          }`}>
                            {index === 0 ? <Crown className="w-4 h-4 text-white" /> :
                             index < 3 ? <Star className="w-4 h-4 text-white" /> :
                             <span className="text-sm font-bold text-gray-600">{index + 1}</span>}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">
                              {member.message_count} 條消息 · {member.announcement_count} 條公告
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">{member.contribution_points || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    暂无排名数据
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">📅 本周概覽</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">本周消息</p>
                  <p className="text-2xl font-bold">
                    {stats.activity.slice(-7).reduce((sum, d) => sum + d.message_count, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">活躍成員</p>
                  <p className="text-2xl font-bold">
                    {stats.activity.length > 0 
                      ? Math.max(...stats.activity.slice(-7).map(d => d.active_members))
                      : 0}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">日均消息</p>
                  <p className="text-2xl font-bold">
                    {stats.activity.length > 0
                      ? Math.round(stats.activity.slice(-7).reduce((sum, d) => sum + d.message_count, 0) / 7)
                      : 0}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">參與率</p>
                  <p className="text-2xl font-bold">
                    {stats.overview.memberCount > 0
                      ? Math.round((Math.max(...stats.activity.slice(-7).map(d => d.active_members)) / stats.overview.memberCount) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-12">
            暂无统计数据
          </div>
        )}
      </div>
    </Layout>
  );
}
