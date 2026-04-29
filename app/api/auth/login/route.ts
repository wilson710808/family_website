import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { ensureJwtSecret } from '@/lib/auth';


const COOKIE_NAME = 'auth-token';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '请填写邮箱和密码' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = db.prepare(
      'SELECT id, email, name, avatar, password, is_admin FROM users WHERE email = ?'
    ).get(email) as {
      id: number;
      email: string;
      name: string;
      avatar: string;
      password: string;
      is_admin: number;
    } | undefined;

    if (!user) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 更新登录统计
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // 获取当前统计
    const currentStats = db.prepare(`
      SELECT login_total, last_login FROM users WHERE id = ?
    `).get(user.id) as { login_total: number, last_login: string | null };
    
    let loginTotal = (currentStats?.login_total || 0) + 1;
    
    // 记录登录日志
    db.prepare(`
      INSERT INTO user_login_logs (user_id, login_time) VALUES (?, ?)
    `).run(user.id, today.toISOString());
    
    // 计算近30天登录次数
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM user_login_logs 
      WHERE user_id = ? AND login_time >= ?
    `).get(user.id, thirtyDaysAgo.toISOString()) as { count: number };
    const login30d = result.count;
    
    // 更新用户表
    db.prepare(`
      UPDATE users 
      SET login_total = ?, login_30d = ?, last_login = ?
      WHERE id = ?
    `).run(loginTotal, login30d, today.toISOString(), user.id);
    
    // 清理30天前的日志
    db.prepare(`
      DELETE FROM user_login_logs WHERE login_time < ?
    `).run(thirtyDaysAgo.toISOString());

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      ensureJwtSecret(),
      { expiresIn: '30d' }
    );

    // 返回用户信息（不包含密码）
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      is_admin: user.is_admin,
    };

    // 设置 cookie 并返回成功
    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

    // 设置 cookie，有效期 30 天
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请重试' },
      { status: 500 }
    );
  }
}
