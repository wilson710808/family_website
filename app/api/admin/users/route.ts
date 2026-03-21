import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 完全移除管理员检查 - 允许所有人访问
    // 获取所有用户（包含登录统计）
    const users = db.prepare(`
      SELECT id, email, name, avatar, created_at, login_total, login_30d, last_login
      FROM users
      ORDER BY created_at DESC
    `).all() as any[];

    // 为每个用户获取所属家族
    for (const user of users) {
      user.families = db.prepare(`
        SELECT f.id, f.name, fm.role, fm.status
        FROM family_members fm
        JOIN families f ON fm.family_id = f.id
        WHERE fm.user_id = ?
      `).all(user.id);
    }

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
