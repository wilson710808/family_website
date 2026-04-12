import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST - 绑定用户到家族树成员
 * DELETE - 解绑用户
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, userId, familyId } = body;

    if (!memberId || !userId || !familyId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 检查成员是否存在且属于该家族
    const member = db.prepare(`
      SELECT * FROM plugin_tree_members WHERE id = ? AND family_id = ?
    `).get(memberId, familyId);

    if (!member) {
      return NextResponse.json({ error: '成员不存在' }, { status: 404 });
    }

    // 检查用户是否已经是该家族成员
    const familyMember = db.prepare(`
      SELECT * FROM family_members WHERE user_id = ? AND family_id = ? AND status = 'approved'
    `).get(userId, familyId);

    if (!familyMember) {
      return NextResponse.json({ error: '用户不是该家族成员' }, { status: 403 });
    }

    // 检查该用户是否已经绑定了其他成员
    const existingBinding = db.prepare(`
      SELECT * FROM plugin_tree_members WHERE family_id = ? AND user_id = ? AND id != ?
    `).get(familyId, userId, memberId);

    if (existingBinding) {
      // 先解绑之前的
      db.prepare(`
        UPDATE plugin_tree_members SET user_id = NULL, is_registered = 0 WHERE id = ?
      `).run((existingBinding as any).id);
    }

    // 绑定
    const result = db.prepare(`
      UPDATE plugin_tree_members
      SET user_id = ?, is_registered = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId, memberId);

    if (result.changes === 0) {
      return NextResponse.json({ error: '绑定失败' }, { status: 500 });
    }

    // 获取用户信息用于返回
    const user = db.prepare(`
      SELECT id, name, avatar FROM users WHERE id = ?
    `).get(userId);

    return NextResponse.json({
      success: true,
      message: '绑定成功',
      user,
    });
  } catch (error) {
    console.error('绑定用户失败:', error);
    return NextResponse.json({ error: '绑定失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const familyId = searchParams.get('familyId');

    if (!memberId || !familyId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const result = db.prepare(`
      UPDATE plugin_tree_members
      SET user_id = NULL, is_registered = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND family_id = ?
    `).run(Number(memberId), Number(familyId));

    if (result.changes === 0) {
      return NextResponse.json({ error: '解绑失败或成员不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: '解绑成功' });
  } catch (error) {
    console.error('解绑用户失败:', error);
    return NextResponse.json({ error: '解绑失败' }, { status: 500 });
  }
}
