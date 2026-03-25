'use client';

import { Trash2 } from 'lucide-react';
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
  return (
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
