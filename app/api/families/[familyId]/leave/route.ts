import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }
    
    const { familyId } = await params;
    const familyIdNum = parseInt(familyId);

    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 检查用户是否是家族成员
    const membership = db.prepare(`
      SELECT fm.*, f.creator_id
      FROM family_members fm
      JOIN families f ON fm.family_id = f.id
      WHERE fm.family_id = ? AND fm.user_id = ?
    `).get(familyIdNum, user.id) as { role: string; status: string; creator_id: number } | undefined;

    if (!membership) {
      return NextResponse.json({ success: false, error: '你不是该家族的成员' }, { status: 403 });
    }

    // 创建者不能退出家族
    if (membership.creator_id === user.id) {
      return NextResponse.json({ 
        success: false, 
        error: '家族创建者不能退出家族。如需解散家族，请使用删除家族功能。' 
      }, { status: 400 });
    }

    // 管理员退出前需要转让管理员权限
    if (membership.role === 'admin') {
      // 检查是否还有其他管理员
      const otherAdmins = db.prepare(`
        SELECT COUNT(*) as count FROM family_members 
        WHERE family_id = ? AND role = 'admin' AND user_id != ? AND status = 'approved'
      `).pluck().get(familyIdNum, user.id) as number;

      if (otherAdmins === 0) {
        // 如果没有其他管理员，自动将创建者设为管理员（如果创建者还在）
        const creatorMembership = db.prepare(`
          SELECT user_id FROM family_members 
          WHERE family_id = ? AND user_id = (SELECT creator_id FROM families WHERE id = ?) AND status = 'approved'
        `).get(familyIdNum, familyIdNum);

        if (creatorMembership) {
          db.prepare(`
            UPDATE family_members SET role = 'admin' WHERE family_id = ? AND user_id = ?
          `).run(familyIdNum, (creatorMembership as any).user_id);
        } else {
          // 找一个活跃成员作为新管理员
          const newAdmin = db.prepare(`
            SELECT user_id FROM family_members 
            WHERE family_id = ? AND user_id != ? AND status = 'approved'
            ORDER BY contribution_points DESC LIMIT 1
          `).get(familyIdNum, user.id) as { user_id: number } | undefined;

          if (newAdmin) {
            db.prepare(`
              UPDATE family_members SET role = 'admin' WHERE family_id = ? AND user_id = ?
            `).run(familyIdNum, newAdmin.user_id);
          }
        }
      }
    }

    // 删除成员记录
    db.prepare(`
      DELETE FROM family_members WHERE family_id = ? AND user_id = ?
    `).run(familyIdNum, user.id);

    return NextResponse.json({ 
      success: true, 
      message: '已成功退出家族' 
    });
  } catch (error) {
    console.error('退出家族失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
