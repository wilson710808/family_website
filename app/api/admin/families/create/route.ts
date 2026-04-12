import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: Request
) {
  try {
    const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { name, description, avatar } = await request.json();

    // 检查权限：只有超级管理员可以创建家族
    if (currentUser.is_admin !== 1) {
      return NextResponse.json(
        { success: false, error: '只有超级管理员可以创建家族' },
        { status: 403 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '请输入家族名称' },
        { status: 400 }
      );
    }

    // 创建家族，超级管理员作为创建者
    const result = db.prepare(`
      INSERT INTO families (name, description, avatar, creator_id, referral_code)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      description || null,
      avatar || null,
      currentUser.id,
      // 生成随机推荐码
      Math.random().toString(36).substring(2, 8)
    );

    const familyId = Number(result.lastInsertRowid);

    // 超级管理员自动加入家族成为管理员
    db.prepare(`
      INSERT INTO family_members (family_id, user_id, role, status)
      VALUES (?, ?, 'admin', 'approved')
    `).run(familyId, currentUser.id);

    console.log(`[ADMIN CREATE FAMILY] Family ${familyId} "${name}" created by super admin ${currentUser.id}`);

    return NextResponse.json({
      success: true,
      message: '家族创建成功',
      familyId,
    });
  } catch (error) {
    console.error('[ADMIN CREATE FAMILY] Error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { success: false, error: `创建失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}
