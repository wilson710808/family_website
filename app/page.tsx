import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, MessageSquare, Bell, LogIn, UserPlus } from 'lucide-react';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-family-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Home className="h-10 w-10 text-family-500" />
            <h1 className="text-3xl font-bold text-family-800">家族中心</h1>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="hidden md:flex items-center px-6 py-3 text-family-600 hover:text-family-700 font-semibold text-xl"
            >
              <LogIn className="h-6 w-6 mr-2" />
              登录
            </Link>
            <Link
              href="/register"
              className="hidden md:flex items-center px-6 py-3 bg-family-500 text-white rounded-xl hover:bg-family-600 font-semibold text-xl transition-colors"
            >
              <UserPlus className="h-6 w-6 mr-2" />
              注册
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
            欢迎来到我们的家族专属空间
          </h2>
          <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            连接每一位家庭成员，记录生活点滴，分享美好时光，让亲情更近一步
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-family-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-family-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">家族群组</h3>
              <p className="text-xl text-gray-600 leading-relaxed">
                创建专属家族群组，邀请亲人加入，所有信息安全隔离，保护家族隐私
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-family-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-10 w-10 text-family-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">公告栏</h3>
              <p className="text-xl text-gray-600 leading-relaxed">
                发布家族重要通知，所有人及时知晓，不错过任何重要家庭活动
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-family-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-family-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">即时聊天</h3>
              <p className="text-xl text-gray-600 leading-relaxed">
                家族成员实时在线聊天，分享生活，互动交流，让亲情时刻在线
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-family-500 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-6">立即加入我们的家族社区</h3>
            <p className="text-xl text-family-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              只需简单几步，就能创建属于你们家族的专属空间，记录每一个温馨时刻
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/register" className="w-full sm:w-auto">
                <ElderFriendlyButton variant="primary" size="lg" fullWidth className="bg-white text-family-600 hover:bg-gray-50">
                  免费注册
                </ElderFriendlyButton>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <ElderFriendlyButton variant="primary" size="lg" fullWidth className="bg-family-600 border border-family-400 hover:bg-family-700">
                  已有账号，直接登录
                </ElderFriendlyButton>
              </Link>
            </div>
          </div>

          {/* Mobile CTA Buttons */}
          <div className="md:hidden mt-8 space-y-4">
            <Link href="/login" className="block">
              <ElderFriendlyButton variant="secondary" fullWidth>
                <span className="flex items-center justify-center">
                  <LogIn className="h-6 w-6 mr-2" />
                  登录
                </span>
              </ElderFriendlyButton>
            </Link>
            <Link href="/register" className="block">
              <ElderFriendlyButton variant="primary" fullWidth>
                <span className="flex items-center justify-center">
                  <UserPlus className="h-6 w-6 mr-2" />
                  注册
                </span>
              </ElderFriendlyButton>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl text-gray-500">© 2025 家族中心. 用心连接每一个家庭.</p>
        </div>
      </footer>
    </div>
  );
}
