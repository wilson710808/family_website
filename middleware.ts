import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 家族数据隔离中间件
 * 
 * 注意：Edge Runtime 不支持 Node.js 模块（如 better-sqlite3）
 * 这里只做基本的路由保护，真正的权限验证在 API 和页面中完成
 */

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 静态资源跳过
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 检查是否有 auth-token
  const token = request.cookies.get('auth-token');
  
  // 如果是登录/注册页面，允许访问
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next();
  }

  // 如果没有 token 且访问需要认证的页面，重定向到登录页
  if (!token && pathname !== '/') {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
