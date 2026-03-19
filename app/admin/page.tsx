import { getCurrentUser } from '@/lib/auth';
import Layout from '@/components/Layout';
import { db } from '@/lib/db';
import { Users, Home, Clock, Trash2, MessageSquare } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// 定义数据类型
interface UserWithFamilies {
  id: number;
  email: string;
  name: string;
  avatar: string;
  created_at: string;
  login_total: number;
  login_30d: number;
  last_login: string | null;
  families: {
    id: number;
    name: string;
    role: string;
    status: string;
  }[];
}

interface FamilyWithMembers {
  id: number;
  name: string;
  description: string;
  avatar: string;
  creator_id: number;
  creator_name: string;
  created_at: string;
  member_count: number;
}

async function getAllUsers(): Promise<UserWithFamilies[]> {
  // 获取所有用户（包含登录统计）
  const users = db.prepare(`
    SELECT id, email, name, avatar, created_at, login_total, login_30d, last_login
    FROM users
    ORDER BY created_at DESC
  `).all() as UserWithFamilies[];

  // 为每个用户获取所属家族
  for (const user of users) {
    user.families = db.prepare(`
      SELECT f.id, f.name, fm.role, fm.status
      FROM family_members fm
      JOIN families f ON fm.family_id = f.id
      WHERE fm.user_id = ?
    `).all(user.id) as any[];
  }

  return users;
}

async function getAllFamilies(): Promise<FamilyWithMembers[]> {
  return db.prepare(`
    SELECT f.*, u.name as creator_name, COUNT(fm.id) as member_count
    FROM families f
    JOIN users u ON f.creator_id = u.id
    LEFT JOIN family_members fm ON f.id = fm.family_id
    GROUP BY f.id
    ORDER BY f.created_at DESC
  `).all() as FamilyWithMembers[];
}

async function getSystemStats() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').pluck().get() as number;
  const familyCount = db.prepare('SELECT COUNT(*) as count FROM families').pluck().get() as number;
  const announcementCount = db.prepare('SELECT COUNT(*) as count FROM announcements').pluck().get() as number;
  const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').pluck().get() as number;
  const chatMessageCount = db.prepare('SELECT COUNT(*) as count FROM chat_messages').pluck().get() as number;

  return {
    userCount,
    familyCount,
    announcementCount,
    messageCount,
    chatMessageCount,
  };
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.is_admin !== 1) {
    redirect('/dashboard');
  }

  const initialUsers = await getAllUsers();
  const initialFamilies = await getAllFamilies();
  const stats = await getSystemStats();

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">系统管理后台 🔧</h1>
          <p className="text-2xl text-red-100">管理所有用户和家族信息</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">总用户数</p>
                <p className="text-4xl font-bold text-gray-900">{stats.userCount}</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">总家族数</p>
                <p className="text-4xl font-bold text-gray-900">{stats.familyCount}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Home className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">公告总数</p>
                <p className="text-4xl font-bold text-gray-900">{stats.announcementCount}</p>
              </div>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">留言总数</p>
                <p className="text-4xl font-bold text-gray-900">{stats.messageCount}</p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl text-gray-500 mb-2">聊天消息</p>
                <p className="text-4xl font-bold text-gray-900">{stats.chatMessageCount}</p>
              </div>
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">用户管理</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">用户</th>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">邮箱</th>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">总登录</th>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">近30天</th>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">最后登录</th>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">加入时间</th>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">所属家族</th>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">状态</th>
                    <th className="px-6 py-4 text-left text-xl font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {initialUsers.map(userRow => (
                    <tr key={userRow.id} className="hover:bg-gray-50">
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <img src={userRow.avatar} alt={userRow.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="text-xl font-semibold text-gray-900">{userRow.name}</p>
                            <p className="text-base text-gray-500">ID: {userRow.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <p className="text-xl text-gray-900">{userRow.email}</p>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xl font-semibold">
                          {userRow.login_total || 0}
                        </span>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xl font-semibold ${
                          (userRow.login_30d || 0) > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {userRow.login_30d || 0}
                        </span>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        {userRow.last_login ? (
                          <p className="text-base text-gray-600">
                            {new Date(userRow.last_login).toLocaleString('zh-CN')}
                          </p>
                        ) : (
                          <p className="text-base text-gray-400">从未登录</p>
                        )}
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <p className="text-base text-gray-600">
                          {new Date(userRow.created_at).toLocaleString('zh-CN')}
                        </p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-wrap gap-2 max-w-[200px]">
                          {userRow.families.length > 0 ? (
                            userRow.families.map(family => (
                              <span
                                key={family.id}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  family.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : family.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {family.name}
                              </span>
                            ))
                          ) : (
                            <p className="text-base text-gray-400">无</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {userRow.email === 'admin@family.com' ? (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              超级管理员
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                              正常
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        {userRow.email !== 'admin@family.com' && (
                          <form
                            method="post"
                            action={`/api/admin/users/${userRow.id}/delete`}
                            onSubmit={(e) => {
                              if (!confirm('确定要删除用户 "' + userRow.name + '" (' + userRow.email + ')？\n此操作不可撤销！')) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <button
                              type="submit"
                              className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-base font-medium transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Family Management */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">家族管理</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">家族名称</th>
                    <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">创建者</th>
                    <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">成员数</th>
                    <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">创建时间</th>
                    <th className="px-8 py-4 text-left text-xl font-semibold text-gray-700">描述</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {initialFamilies.map(family => (
                    <tr key={family.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-4">
                          <img src={family.avatar} alt={family.name} className="w-12 h-12 rounded-full" />
                          <div>
                            <p className="text-xl font-semibold text-gray-900">{family.name}</p>
                            <p className="text-lg text-gray-500">ID: {family.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-xl text-gray-900">{family.creator_name}</p>
                        <p className="text-lg text-gray-500">ID: {family.creator_id}</p>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {family.member_count} 人
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-lg text-gray-600">
                          {new Date(family.created_at).toLocaleString('zh-CN')}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-lg text-gray-600 line-clamp-2">
                          {family.description || '暂无描述'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
