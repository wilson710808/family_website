'use client';

import { Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import UserDeleteButton from '@/components/UserDeleteButton';

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

interface AdminUserTableProps {
  users: UserWithFamilies[];
}

export default function AdminUserTable({ users }: AdminUserTableProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateUser() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, is_admin: isAdmin ? 1 : 0 }),
      });
      const data = await res.json();
      if (data.success) {
        // 刷新页面
        window.location.reload();
      } else {
        setError(data.error || '创建失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Modal for creating new user */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">手动新增用户</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-medium mb-2">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="输入用户姓名"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="输入邮箱地址"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">初始密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="输入初始密码（至少6位）"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={isAdmin}
                  onChange={e => setIsAdmin(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="is_admin" className="text-lg font-medium">设为管理员</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-lg font-medium"
                >
                  {loading ? '创建中...' : '创建用户'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 px-4 py-3 bg-gray-50 border-b">
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增用户
        </button>
      </div>

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
            {users.map(userRow => (
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
                      <p className="text-base text-gray-400">N/A</p>
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
                    <UserDeleteButton
                      userId={String(userRow.id)}
                      userName={userRow.name}
                      userEmail={userRow.email}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
