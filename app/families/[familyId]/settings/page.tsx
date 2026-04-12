import { getCurrentUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';

import { ArrowLeft, Settings, Users, Image, Bell, Shield, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import FamilyDeleteButton from '@/components/FamilyDeleteButton';
import CopyButton from '@/components/CopyButton';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

interface SettingsPageProps {
  params: Promise<{ familyId: string }>;
}

async function getFamily(familyId: number, userId: number) {
  const family = db.prepare(`
    SELECT f.*, fm.role, fm.status
    FROM families f
    JOIN family_members fm ON f.id = fm.family_id
    WHERE f.id = ? AND fm.user_id = ?
  `).get(familyId, userId);

  return family as {
    id: number;
    name: string;
    description: string;
    avatar: string;
    creator_id: number;
    referral_code: string;
    created_at: string;
    role: string;
    status: string;
  } | undefined;
}

async function getMemberCount(familyId: number) {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM family_members WHERE family_id = ? AND status = 'approved'
  `).get(familyId) as { count: number };
  return result.count;
}

export default async function FamilySettingsPage({ params }: SettingsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { familyId } = await params;
  const familyIdNum = parseInt(familyId);

  if (isNaN(familyIdNum)) {
    notFound();
  }

  const family = await getFamily(familyIdNum, user.id);

  if (!family) {
    notFound();
  }

  if (family.status !== 'approved') {
    redirect('/families');
  }

  // 只有管理员可以访问设置页面
  if (family.role !== 'admin') {
    redirect(`/families/${familyId}`);
  }

  const memberCount = await getMemberCount(familyIdNum);
  const isCreator = family.creator_id === user.id;

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href={`/families/${familyId}`} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-8 w-8 text-gray-600" />
              家族设置
            </h1>
            <p className="text-gray-600 mt-1">{family.name}</p>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            基本信息
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={family.avatar} alt={family.name} className="w-20 h-20 rounded-full" />
              <div>
                <p className="text-lg font-semibold">{family.name}</p>
                <p className="text-gray-500">{family.description || '暂无描述'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">成员数量</p>
                <p className="text-lg font-semibold">{memberCount} 人</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">创建时间</p>
                <p className="text-lg font-semibold">
                  {new Date(family.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 推荐码 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            邀请设置
          </h2>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">家族推荐码</p>
                <p className="text-2xl font-bold text-blue-600 font-mono">{family.referral_code}</p>
                <p className="text-sm text-blue-600 mt-1">
                  将此码发给家人，注册时输入即可加入家族
                </p>
              </div>
              <CopyButton text={family.referral_code} />
            </div>
          </div>
        </div>

        {/* 插件管理 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-500" />
            插件管理
          </h2>
          <div className="space-y-3">
            <Link
              href={`/plugins/birthday?familyId=${familyId}`}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-pink-500" />
                <div>
                  <p className="font-medium">生日提醒</p>
                  <p className="text-sm text-gray-500">管理家族成员生日提醒</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href={`/plugins/album?familyId=${familyId}`}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">家庭相册</p>
                  <p className="text-sm text-gray-500">上传和分享家庭照片</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href={`/plugins/calendar?familyId=${familyId}`}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">事件日历</p>
                  <p className="text-sm text-gray-500">管理家族重要事件</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href={`/plugins/tree?familyId=${familyId}`}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">家族树</p>
                  <p className="text-sm text-gray-500">可视化家族关系图谱</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </div>

        {/* 危险操作 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-200">
          <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            危险操作
          </h2>
          <div className="space-y-4">
            {isCreator ? (
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-800 mb-2">
                  您是家族创建者，可以解散此家族。此操作不可撤销，所有数据将被永久删除。
                </p>
                <FamilyDeleteButton familyId={familyId} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                只有家族创建者可以解散家族。如需退出，请返回家族详情页使用"退出家族"功能。
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <Link href={`/families/${familyId}`} className="text-blue-500 hover:underline">
            ← 返回家族详情
          </Link>
        </div>
      </div>
    </Layout>
  );
}
