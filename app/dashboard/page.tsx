import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { Users, Bell, MessageSquare, Plus, Calendar, Clock } from 'lucide-react';
import { db } from '@/lib/db';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

async function getRecentActivities(userId: number) {
  const families = await getUserFamilies(userId);
  const familyIds = families.filter(f => f.status === 'approved').map(f => f.id);
  
  if (familyIds.length === 0) return [];

  const placeholders = familyIds.map(() => '?').join(',');
  
  // 获取最近的公告
  const announcements = db.prepare(`
    SELECT a.*, u.name as user_name, 'announcement' as type
    FROM announcements a
    JOIN users u ON a.user_id = u.id
    WHERE a.family_id IN (${placeholders})
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all(...familyIds);

  // 获取最近的留言
  const messages = db.prepare(`
    SELECT m.*, u.name as user_name, 'message' as type
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.family_id IN (${placeholders})
    ORDER BY m.created_at DESC
    LIMIT 5
  `).all(...familyIds);

  // 合并并按时间排序
  const allActivities = [...announcements, ...messages].sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 10);

  return allActivities;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const families = await getUserFamilies(user.id);
  const approvedFamilies = families.filter(f => f.status === 'approved');
  const pendingInvitations = families.filter(f => f.status === 'pending');
  const recentActivities = await getRecentActivities(user.id);

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-family-500 to-family-600 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">你好，{user.name} 👋</h1>
          <p className="text-2xl text-family-100 mb-8">欢迎回到家族中心，今天有什么新消息？</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/families/create">
              <ElderFriendlyButton variant="primary" size="lg" className="bg-white text-family-600 hover:bg-gray-50">
                <span className="flex items-center">
                  <Plus className="h-6 w-6 mr-2" />
                  创建新家族
                </span>
              </ElderFriendlyButton>
            </Link>
            <Link href="/announcements">
              <ElderFriendlyButton variant="primary" size="lg" className="bg-family-600 border border-family-400 hover:bg-family-700">
                <span className="flex items-center">
                  <Bell className="h-6 w-6 mr-2" />
                  查看公告
                </span>
              </ElderFriendlyButton>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">我的家族</p>
                <p className="text-4xl font-bold text-gray-900">{approvedFamilies.length}</p>
              </div>
              <div className="w-16 h-16 bg-family-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-family-500" />
              </div>
            </div>
            {pendingInvitations.length > 0 && (
              <p className="text-xl text-orange-600 font-medium mt-3">
                ⚠️ 有 {pendingInvitations.length} 个待处理的邀请
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">公告总数</p>
                <p className="text-4xl font-bold text-gray-900">
                  {approvedFamilies.length > 0 
                    ? String((db.prepare('SELECT COUNT(*) as count FROM announcements WHERE family_id IN (' + approvedFamilies.map(() => '?').join(',') + ')').pluck().get(...approvedFamilies.map(f => f.id)) || 0))
                    : '0'
                  }
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">留言总数</p>
                <p className="text-4xl font-bold text-gray-900">
                  {approvedFamilies.length > 0
                    ? String((db.prepare('SELECT COUNT(*) as count FROM messages WHERE family_id IN (' + approvedFamilies.map(() => '?').join(',') + ')').pluck().get(...approvedFamilies.map(f => f.id)) || 0))
                    : '0'
                  }
                </p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* My Families */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">我的家族</h2>
            <Link href="/families" className="text-xl text-family-600 hover:text-family-700 font-semibold">
              查看全部 →
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
                    <p className="text-xl text-gray-500 mt-1">{family.role === 'admin' ? '管理员' : '成员'}</p>
                  </div>
                </div>
                <p className="text-xl text-gray-600 mb-6 line-clamp-2">
                  {family.description || '暂无描述'}
                </p>
                <div className="flex items-center text-lg text-gray-500">
                  <Calendar className="h-5 w-5 mr-2" />
                  创建于 {new Date(family.created_at).toLocaleDateString('zh-CN')}
                </div>
              </Link>
            ))}

            {approvedFamilies.length === 0 && (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
                <Users className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-medium text-gray-900 mb-4">还没有加入任何家族</h3>
                <p className="text-xl text-gray-500 mb-8">创建一个新家族，或者邀请家人加入吧</p>
                <Link href="/families/create">
                  <ElderFriendlyButton variant="primary" size="lg">
                    <span className="flex items-center">
                      <Plus className="h-6 w-6 mr-2" />
                      创建家族
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
            <h2 className="text-3xl font-bold text-gray-900">最新动态</h2>
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
                            {activity.type === 'announcement' ? ' 发布了新公告' : ' 发表了新留言'}
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
                        {activity.type === 'announcement' ? '公告' : '留言'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                <p className="text-xl text-gray-500">暂无动态</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
