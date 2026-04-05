import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: '请填写姓名、邮箱和密码' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度至少6位' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).get(email) as { id: number } | undefined;

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 创建用户 - 暂不启用邮件验证，注册即激活
    const result = db.prepare(`
      INSERT INTO users (name, email, password, is_admin)
      VALUES (?, ?, ?, 0)
    `).run(name.trim(), email.trim(), hashedPassword);

    const userId = result.lastInsertRowid as number;

    return NextResponse.json({
      success: true,
      message: '注册成功，请登录',
      userId
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请重试' },
      { status: 500 }
    );
  }
}
