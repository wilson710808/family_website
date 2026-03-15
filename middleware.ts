import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'family-website-secret-key-change-in-production';

// 不需要登录的路径
const publicPaths = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 公共路径直接放行
  if (publicPaths.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api/socket')) {
    return NextResponse.next();
  }

  // 检查auth token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 验证token
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // token无效，重定向到登录页
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
