import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Users, Calendar, Clock, Check, X, UserPlus } from 'lucide-react';
import { db } from '@/lib/db';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function FamiliesPage() {
  const user = await getCurrentUser();

  // 未登录重定向到登录页
  if (!user) {
    redirect('/login');
  }

  const families = await getUserFamilies(user.id);
  const approvedFamilies = families.filter(f => f.status === 'approved');
  const pendingInvitations = families.filter(f => f.status === 'pending');

  // 获取每个家族的成员数量
  const familiesWithMemberCount = approvedFamilies.map(family => {
    const memberCount = db.prepare('SELECT COUNT(*) as count FROM family_members WHERE family_id = ? AND status = ?').pluck().get(family.id, 'approved') as number;
    return { ...family, memberCount };
  });

  return (
    <Layout user={user}>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">我的家族</h1>
          <Link href="/families/create">
            <ElderFriendlyButton variant="primary" size="md">
              <span className="flex items-center">
                <Plus className="h-6 w-6 mr-2" />
                创建家族
              </span>
            </ElderFriendlyButton>
          </Link>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <UserPlus className="h-8 w-8 mr-2 text-orange-500" />
              待处理邀请 ({pendingInvitations.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingInvitations.map(family => (
                <div key={family.id} className="bg-white rounded-xl shadow-sm p-8 border-2 border-orange-200">
                  <div className="flex items-center space-x-4 mb-6">
                    <img src={family.avatar} alt={family.name} className="w-20 h-20 rounded-full" />
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{family.name}</h3>
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-lg rounded-full mt-2">
                        待审核
                      </span>
                    </div>
                  </div>
                  <p className="text-xl text-gray-600 mb-6 line-clamp-2">
                    {family.description || '暂无描述'}
                  </p>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center text-lg text-gray-500">
                      <Calendar className="h-5 w-5 mr-2" />
                      邀请于 {new Date(family.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <form action={`/api/families/${family.id}/respond`} method="POST" className="flex-1">
                      <input type="hidden" name="action" value="accept" />
                      <ElderFriendlyButton
                        type="submit"
                        variant="success"
                        fullWidth
                        size="md"
                      >
                        <span className="flex items-center justify-center">
                          <Check className="h-5 w-5 mr-2" />
                          接受
                        </span>
                      </ElderFriendlyButton>
                    </form>
                    <form action={`/api/families/${family.id}/respond`} method="POST" className="flex-1">
                      <input type="hidden" name="action" value="reject" />
                      <ElderFriendlyButton
                        type="submit"
                        variant="danger"
                        fullWidth
                        size="md"
                      >
                        <span className="flex items-center justify-center">
                          <X className="h-5 w-5 mr-2" />
                          拒绝
                        </span>
                      </ElderFriendlyButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Families */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">已加入的家族 ({approvedFamilies.length})</h2>
          {approvedFamilies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familiesWithMemberCount.map(family => (
                <Link
                  key={family.id}
                  href={`/families/${family.id}`}
                  className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <img src={family.avatar} alt={family.name} className="w-20 h-20 rounded-full" />
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{family.name}</h3>
                      <p className="text-lg text-gray-500 mt-1">{family.role === 'admin' ? '管理员' : '成员'}</p>
                    </div>
                  </div>
                  <p className="text-xl text-gray-600 mb-6 line-clamp-2">
                    {family.description || '暂无描述'}
                  </p>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center text-lg text-gray-500">
                      <Users className="h-5 w-5 mr-2" />
                      {family.memberCount} 位成员
                    </div>
                    <div className="flex items-center text-lg text-gray-500">
                      <Calendar className="h-5 w-5 mr-2" />
                      {new Date(family.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <span className="inline-flex items-center text-xl text-family-600 font-semibold">
                      进入家族
                      <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
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
    </Layout>
  );
}
