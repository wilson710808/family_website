import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 完全禁用认证中间件
 * 认证系统已被插拔式移除，所有请求直接放行
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// 不匹配任何路径，完全不运行中间件
export const config = {
  matcher: [],
};
