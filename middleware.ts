import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 家族数据隔离中间件
 * - 验证用户是否为家族成员
 * - 防止未授权访问其他家族数据
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 只处理家族相关路由
  const familyPathPattern = /^\/families\/(\d+)/;
  const match = pathname.match(familyPathPattern);

  if (!match) {
    return NextResponse.next();
  }

  const familyId = match[1];

  // 获取用户的 auth-token
  const token = request.cookies.get('auth-token');

  if (!token) {
    // 未登录，重定向到首页
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };
    const userId = decoded.userId;

    // 动态导入 db（避免 SSR 问题）
    const { db } = await import('./lib/db');
    const Database = (await import('better-sqlite3')).default;
    const localDb = new Database('family.db');

    // 检查用户是否是家族成员
    const member = localDb.prepare(`
      SELECT id FROM family_members
      WHERE family_id = ? AND user_id = ? AND status = 'approved'
    `).get(familyId, userId);

    if (!member) {
      // 不是家族成员，禁止访问
      return NextResponse.json(
        { error: '無權訪問此家族' },
        { status: 403 }
      );
    }

    // 是家族成员，继续
    return NextResponse.next();
  } catch (error) {
    // token 无效，重定向
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    '/families/:familyId*',
    '/chat/:familyId*',
    '/plugins/:plugin*',
  ],
};
