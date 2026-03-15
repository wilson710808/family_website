import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Users, Bell, MessageSquare, Send, UserPlus, Settings } from 'lucide-react';
import { db } from '@/lib/db';

interface FamilyPageProps {
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
    created_at: string;
    role: string;
    status: string;
  } | undefined;
}

async function getFamilyMembers(familyId: number) {
  const members = db.prepare(`
    SELECT u.id, u.name, u.avatar, fm.role, fm.status, fm.created_at
    FROM family_members fm
    JOIN users u ON fm.user_id = u.id
    WHERE fm.family_id = ?
    ORDER BY fm.role DESC, fm.created_at ASC
  `).all(familyId) as {
    id: number;
    name: string;
    avatar: string;
    role: string;
    status: string;
    created_at: string;
  }[];

  return members;
}

async function getRecentAnnouncements(familyId: number) {
  const announcements = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM announcements a
    JOIN users u ON a.user_id = u.id
    WHERE a.family_id = ?
    ORDER BY a.created_at DESC
    LIMIT 3
  `).all(familyId) as {
    id: number;
    title: string;
    content: string;
    user_name: string;
    created_at: string;
  }[];

  return announcements;
}

async function getRecentMessages(familyId: number) {
  const messages = db.prepare(`
    SELECT m.*, u.name as user_name, u.avatar as user_avatar
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.family_id = ?
    ORDER BY m.created_at DESC
    LIMIT 5
  `).all(familyId) as {
    id: number;
    content: string;
    user_name: string;
    user_avatar: string;
    created_at: string;
  }[];

  return messages;
}

export default async function FamilyDetailPage({ params }: FamilyPageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

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

  const members = await getFamilyMembers(familyIdNum);
  const announcements = await getRecentAnnouncements(familyIdNum);
  const messages = await getRecentMessages(familyIdNum);
  const approvedMembers = members.filter(m => m.status === 'approved');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/families" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{family.name}</h1>
            <p className="text-gray-600 mt-1">{family.description || '暂无描述'}</p>
          </div>
        </div>

        {/* Family Header Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-family-500 to-family-600 h-32 relative">
            {family.role === 'admin' && (
              <button className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="px-6 pb-6">
            <div className="flex justify-between items-end -mt-12">
              <img
                src={family.avatar}
                alt={family.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-md"
              />
              <div className="flex space-x-3">
                <Link
                  href={`/chat?familyId=${familyId}`}
                  className="flex items-center px-4 py-2 bg-family-500 text-white rounded-lg hover:bg-family-600 font-medium transition-colors"
                >
                  <Send className="h-5 w-5 mr-2" />
                  开始聊天
                </Link>
                {family.role === 'admin' && (
                  <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                    <UserPlus className="h-5 w-5 mr-2" />
                    邀请成员
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{approvedMembers.length}</p>
                <p className="text-sm text-gray-500">成员总数</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
                <p className="text-sm text-gray-500">公告数量</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                <p className="text-sm text-gray-500">留言总数</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href={`/announcements?familyId=${familyId}`}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-medium text-gray-900">公告栏</h3>
            <p className="text-sm text-gray-500 mt-1">查看家族通知</p>
          </Link>

          <Link
            href={`/messages?familyId=${familyId}`}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-medium text-gray-900">留言板</h3>
            <p className="text-sm text-gray-500 mt-1">分享生活点滴</p>
          </Link>

          <Link
            href={`/chat?familyId=${familyId}`}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="font-medium text-gray-900">即时聊天</h3>
            <p className="text-sm text-gray-500 mt-1">实时在线交流</p>
          </Link>

          <Link
            href={`/families/${familyId}/members`}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="font-medium text-gray-900">成员列表</h3>
            <p className="text-sm text-gray-500 mt-1">查看家族成员</p>
          </Link>
        </div>

        {/* Recent Announcements */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-500" />
              最新公告
            </h2>
            <Link
              href={`/announcements?familyId=${familyId}`}
              className="text-family-600 hover:text-family-700 font-medium text-sm"
            >
              查看全部
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {announcements.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(announcement.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{announcement.content}</p>
                    <p className="text-xs text-gray-500">发布者：{announcement.user_name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无公告</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
              最新留言
            </h2>
            <Link
              href={`/messages?familyId=${familyId}`}
              className="text-family-600 hover:text-family-700 font-medium text-sm"
            >
              查看全部
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {messages.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {messages.map(message => (
                  <div key={message.id} className="p-6">
                    <div className="flex items-start space-x-3">
                      <img
                        src={message.user_avatar}
                        alt={message.user_name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{message.user_name}</p>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {new Date(message.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无留言</p>
              </div>
            )}
          </div>
        </div>

        {/* Members */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-orange-500" />
              家族成员 ({approvedMembers.length})
            </h2>
            <Link
              href={`/families/${familyId}/members`}
              className="text-family-600 hover:text-family-700 font-medium text-sm"
            >
              查看全部
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {approvedMembers.slice(0, 12).map(member => (
              <div key={member.id} className="bg-white rounded-xl shadow-sm p-4 text-center">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-16 h-16 rounded-full mx-auto mb-3"
                />
                <p className="font-medium text-gray-900 truncate">{member.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {member.role === 'admin' ? '管理员' : '成员'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
