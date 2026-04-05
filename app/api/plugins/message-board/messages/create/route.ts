import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../../plugins/message-board';
import { db } from '@/lib/db';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';

// 发送新留言
export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { content, familyId } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '请输入留言内容' }, { status: 400 });
    }

    if (!familyId) {
      return NextResponse.json({ error: '缺少家族ID' }, { status: 400 });
    }

    // 检查用户是否在家族中
    if (!isUserInFamily(familyId, user.id)) {
      return NextResponse.json({ error: '你不在这个家族中，无法留言' }, { status: 403 });
    }

    // 插入留言
    const result = db.prepare(`
      INSERT INTO messages (family_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(familyId, user.id, content.trim());

    return NextResponse.json({
      success: true,
      messageId: result.lastInsertRowid,
      message: '发送成功'
    });
  } catch (error: any) {
    console.error('发送留言失败:', error);
    return NextResponse.json(
      { error: '发送失敗', message: error.message },
      { status: 500 }
    );
  }
}
