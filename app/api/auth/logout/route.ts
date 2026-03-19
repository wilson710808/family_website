import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'auth-token';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // 清除 cookie
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // 立即过期
  });

  return response;
}
