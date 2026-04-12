import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { ArrowLeft, Users, Star } from 'lucide-react';
import { db } from '@/lib/db';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

interface MembersPageProps {
  params: Promise<{ familyId: string }>;
}

// 渲染星星组件
function renderStars(stars: number) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star 
          key={i} 
          className={`w-5 h-5 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
        />
      ))}
    </div>
  );
}

async function getFamily(familyId: number) {
  const family = db.prepare(`
    SELECT * FROM families WHERE id = ?
  `).get(familyId) as {
    id: number;
    name: string;
    description: string;
    avatar: string;
  };

  return family;
}

async function getFamilyMembers(familyId: number) {
  const members = db.prepare(`
    SELECT u.id, u.name, u.avatar, u.login_total, u.last_login, 
           fm.role, fm.status, fm.relationship, fm.contribution_points, fm.contribution_stars,
           fm.created_at
    FROM family_members fm
    JOIN users u ON fm.user_id = u.id
    WHERE fm.family_id = ? AND fm.status = 'approved'
    ORDER BY fm.contribution_stars DESC, fm.contribution_points DESC, fm.created_at ASC
  `).all(familyId) as {
    id: number;
    name: string;
    avatar: string;
    login_total: number;
    last_login: string | null;
    role: string;
    status: string;
    relationship?: string;
    contribution_points?: number;
    contribution_stars?: number;
    created_at: string;
  }[];

  return members;
}

export default async function FamilyMembersPage({ params }: MembersPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { familyId } = await params;
  const familyIdNum = parseInt(familyId);

  if (isNaN(familyIdNum)) {
    notFound();
  }

  const family = await getFamily(familyIdNum);
  const members = await getFamilyMembers(familyIdNum);

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href={`/families/${familyId}`} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{family.name} - 成员列表</h1>
            <p className="text-gray-600 mt-1">共 {members.length} 位成员</p>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">成员</th>
                  <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">关系</th>
                  <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">贡献度</th>
                  <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">角色</th>
                  <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">登录统计</th>
                  <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">加入时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                        <div>
                          <p className="text-xl font-semibold text-gray-900">{member.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      {member.relationship ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xl font-medium">
                          {member.relationship}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-lg">未设置</span>
                      )}
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-col items-start">
                        {renderStars(member.contribution_stars || 1)}
                        <span className="text-sm text-gray-500 mt-1">
                          {member.contribution_points || 0} 积分
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-lg font-medium ${
                        member.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {member.role === 'admin' ? '管理员' : '成员'}
                      </span>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div>
                        <p className="text-lg text-gray-900">累计登录: {member.login_total || 0}</p>
                        {member.last_login && (
                          <p className="text-sm text-gray-500">
                            最后登录: {new Date(member.last_login).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <p className="text-lg text-gray-600">
                        {new Date(member.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 贡献度说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-blue-800 mb-3">⭐ 贡献度星级说明</h3>
          <ul className="space-y-2 text-lg text-blue-700">
            <li>• 1⭐ 新成员 (0-99 积分) - 刚加入家族的新成员</li>
            <li>• 2⭐ 活跃成员/创建者 (100-299 积分) - 家族创建者默认二星</li>
            <li>• 3⭐ 核心成员 (300-599 积分) - 经常参与家族活动</li>
            <li>• 4⭐ 资深成员 (600-999 积分) - 为家族做出重要贡献</li>
            <li>• 5⭐ 顶流贡献 (1000+ 积分) - 家族最重要的成员</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-lg text-blue-700">
              <strong>积分获取规则：</strong>每次登录 +5 积分，发送聊天消息 +2 积分，发布公告 +10 积分，发布留言 +5 积分
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function notFound(): never {
  throw new Error('Not found');
}
