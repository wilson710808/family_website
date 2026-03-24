'use client';

import Link from 'next/link';
import { Users, Bell, MessageSquare, Plus, Calendar, Clock, BookOpen } from 'lucide-react';
import Layout from '@/components/Layout';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';
import { useI18n } from '@/lib/i18n';
import BirthdayWidget from '@/components/plugins/BirthdayWidget';
import RecentPhotosWidget from '@/components/plugins/RecentPhotosWidget';
import BookGuideWidget from '@/components/plugins/BookGuideWidget';

interface DashboardClientProps {
  user: any;
  approvedFamilies: any[];
  pendingInvitations: any[];
  recentActivities: any[];
  stats: {
    totalAnnouncements: number;
    totalMessages: number;
  };
}

export default function DashboardClient({ 
  user, 
  approvedFamilies, 
  pendingInvitations, 
  recentActivities,
  stats
}: DashboardClientProps) {
  const { t } = useI18n();

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-family-500 to-family-600 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">{t('welcome')}{user.name} 👋</h1>
          <p className="text-2xl text-family-100 mb-8">{t('welcome_message')}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/families/create">
              <ElderFriendlyButton variant="primary" size="lg" className="bg-white text-family-600 hover:bg-gray-50">
                <span className="flex items-center">
                  <Plus className="h-6 w-6 mr-2" />
                  {t('create_new_family')}
                </span>
              </ElderFriendlyButton>
            </Link>
            <Link href="/announcements">
              <ElderFriendlyButton variant="primary" size="lg" className="bg-family-600 border border-family-400 hover:bg-family-700">
                <span className="flex items-center">
                  <Bell className="h-6 w-6 mr-2" />
                  {t('view_all_announcements')}
                </span>
              </ElderFriendlyButton>
            </Link>
            {approvedFamilies.length > 0 && (
              <Link href={`/plugins/growth-column?familyId=${approvedFamilies[0].id}`}>
                <ElderFriendlyButton variant="primary" size="lg" className="bg-purple-500 border border-purple-400 hover:bg-purple-600">
                  <span className="flex items-center">
                    <BookOpen className="h-6 w-6 mr-2" />
                    成长专栏
                  </span>
                </ElderFriendlyButton>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">{t('my_families')}</p>
                <p className="text-4xl font-bold text-gray-900">{approvedFamilies.length}</p>
              </div>
              <div className="w-16 h-16 bg-family-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-family-500" />
              </div>
            </div>
            {pendingInvitations.length > 0 && (
              <p className="text-xl text-orange-600 font-medium mt-3">
                ⚠️ {t('pending_invitations')}: {pendingInvitations.length}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">{t('total_announcements')}</p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalAnnouncements}</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">{t('total_messages')}</p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalMessages}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 插件小部件区域 - 生日提醒 + 最新照片 + 成长专栏（只在插件启用时显示 */}
        {approvedFamilies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BirthdayWidget familyId={approvedFamilies[0].id} />
            <RecentPhotosWidget familyId={approvedFamilies[0].id} />
            <BookGuideWidget familyId={approvedFamilies[0].id} />
          </div>
        )}

        {/* My Families */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{t('my_families_title')}</h2>
            <Link href="/families" className="text-xl text-family-600 hover:text-family-700 font-semibold">
              {t('view_all')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedFamilies.slice(0, 3).map(family => (
              <Link
                key={family.id}
                href={`/families/${family.id}`}
                className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <img src={family.avatar} alt={family.name} className="w-20 h-20 rounded-full" />
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">{family.name}</h3>
                    <p className="text-xl text-gray-500 mt-1">{family.role === 'admin' ? t('admin') : t('member')}</p>
                  </div>
                </div>
                <p className="text-xl text-gray-600 mb-6 line-clamp-2">
                  {family.description || t('no_description')}
                </p>
                <div className="flex items-center text-lg text-gray-500">
                  <Calendar className="h-5 w-5 mr-2" />
                  {t('created_at')} {new Date(family.created_at).toLocaleDateString('zh-CN')}
                </div>
              </Link>
            ))}

            {approvedFamilies.length === 0 && (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
                <Users className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-medium text-gray-900 mb-4">{t('no_families_yet')}</h3>
                <p className="text-xl text-gray-500 mb-8">{t('create_first_family')}</p>
                <Link href="/families/create">
                  <ElderFriendlyButton variant="primary" size="lg">
                    <span className="flex items-center">
                      <Plus className="h-6 w-6 mr-2" />
                      {t('create_family')}
                    </span>
                  </ElderFriendlyButton>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{t('recent_activities')}</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {recentActivities.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentActivities.slice(0, 10).map((activity: any) => (
                  <div key={activity.id} className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'announcement' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {activity.type === 'announcement' ? (
                            <Bell className="h-7 w-7 text-blue-500" />
                          ) : (
                            <MessageSquare className="h-7 w-7 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xl text-gray-900">
                            <span className="font-semibold">{activity.user_name}</span>
                            {activity.type === 'announcement' ? ` ${t('announcement')}` : ` ${t('message')}`}
                          </p>
                          <p className="mt-3 text-xl text-gray-600">{activity.title || activity.content}</p>
                          <p className="mt-4 text-lg text-gray-500 flex items-center">
                            <Clock className="h-5 w-5 mr-2" />
                            {new Date(activity.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <span className={`text-lg px-4 py-2 rounded-full font-medium ${
                        activity.type === 'announcement' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {activity.type === 'announcement' ? t('announcement') : t('message')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                <p className="text-xl text-gray-500">{t('no_activities_yet')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
