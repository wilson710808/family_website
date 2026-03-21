import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    // 完全移除认证检查
    const user = await getCurrentUser();
    const { familyId } = await params;
    const formData = await request.formData();
    const action = formData.get('action') as string;

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: '无效的操作' }, { status: 400 });
    }

    // 检查是否有邀请
    const invitation = db.prepare(`
      SELECT * FROM family_members 
      WHERE family_id = ? AND user_id = ? AND status = 'pending'
    `).get(familyId, user.id);

    if (!invitation) {
      return NextResponse.json({ success: false, error: '邀请不存在' }, { status: 404 });
    }

    if (action === 'accept') {
      // 接受邀请
      db.prepare(`
        UPDATE family_members 
        SET status = 'approved' 
        WHERE family_id = ? AND user_id = ?
      `).run(familyId, user.id);
    } else {
      // 拒绝邀请
      db.prepare(`
        DELETE FROM family_members 
        WHERE family_id = ? AND user_id = ?
      `).run(familyId, user.id);
    }

    // 重定向回家族列表
    return NextResponse.redirect(new URL('/families', request.url));
  } catch (error) {
    console.error('处理邀请接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
