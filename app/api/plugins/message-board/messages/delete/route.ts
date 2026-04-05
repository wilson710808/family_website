import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../../plugins/message-board';
import { db } from '@/lib/db';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';

// 删除自己的留言
export async function DELETE(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = Number(searchParams.get('id'));
    const familyId = Number(searchParams.get('familyId'));

    if (!messageId || !familyId) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    // 检查用户是否在家族中
    if (!isUserInFamily(familyId, user.id)) {
      return NextResponse.json({ error: '你不在这个家族中' }, { status: 403 });
    }

    // 检查留言是否属于当前用户
    const message = db.prepare(`
      SELECT user_id FROM messages WHERE id = ? AND family_id = ?
    `).get(messageId, familyId);

    if (!message) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }

    if ((message as any).user_id !== user.id) {
      return NextResponse.json({ error: '只能删除自己发送的留言' }, { status: 403 });
    }

    // 删除留言
    db.prepare(`
      DELETE FROM messages WHERE id = ? AND family_id = ?
    `).run(messageId, familyId);

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('删除留言失败:', error);
    return NextResponse.json(
      { error: '删除失敗', message: error.message },
      { status: 500 }
    );
  }
}
