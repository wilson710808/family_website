import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name, avatar, referralCode } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: '请填写完整信息' }, { status: 400 });
    }

    const result = await registerUser(email, password, name, avatar, referralCode);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('注册接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
