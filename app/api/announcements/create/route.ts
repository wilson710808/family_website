import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { title, content, familyId } = await request.json();

    if (!title?.trim() || !content?.trim() || !familyId) {
      return NextResponse.json({ success: false, error: '请填写完整信息' }, { status: 400 });
    }

    const familyIdNum = parseInt(familyId);
    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 检查用户是否属于该家族且是管理员
    const member = db.prepare(`
      SELECT role FROM family_members 
      WHERE user_id = ? AND family_id = ? AND status = 'approved'
    `).get(user.id, familyIdNum) as { role: string } | undefined;

    if (!member) {
      return NextResponse.json({ success: false, error: '无权在该家族发布公告' }, { status: 403 });
    }

    // 只有管理员可以发布公告
    if (member.role !== 'admin') {
      return NextResponse.json({ success: false, error: '只有管理员可以发布公告' }, { status: 403 });
    }

    // 创建公告
    const result = db.prepare(
      'INSERT INTO announcements (family_id, user_id, title, content) VALUES (?, ?, ?, ?)'
    ).run(familyIdNum, user.id, title.trim(), content.trim());

    return NextResponse.json({ success: true, announcementId: result.lastInsertRowid });
  } catch (error) {
    console.error('发布公告接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
