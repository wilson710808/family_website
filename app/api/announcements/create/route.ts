import { NextResponse } from 'next/server';
import { getCurrentUser, addContributionPoints } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // 完全移除认证检查 - 允许所有人发布公告
    const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { title, content, familyId } = await request.json();

    if (!title?.trim() || !content?.trim() || !familyId) {
      return NextResponse.json({ success: false, error: '请填写完整信息' }, { status: 400 });
    }

    const familyIdNum = parseInt(familyId);
    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 移除权限检查 - 所有人都可以发布公告
    const result = db.prepare(
      'INSERT INTO announcements (family_id, user_id, title, content) VALUES (?, ?, ?, ?)'
    ).run(familyIdNum, user.id, title.trim(), content.trim());

    // 发布公告获得 +10 贡献积分
    addContributionPoints(familyIdNum, user.id, 10);

    return NextResponse.json({ success: true, announcementId: result.lastInsertRowid });
  } catch (error) {
    console.error('发布公告接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
