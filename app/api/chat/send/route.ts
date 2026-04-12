import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, addContributionPoints } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { familyId, content } = await request.json();

    if (!familyId || !content?.trim()) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    // 插入消息
    const result = db.prepare(`
      INSERT INTO chat_messages (family_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(Number(familyId), user.id, content.trim());

    // 添加贡献积分：发送聊天消息 +2 积分
    addContributionPoints(Number(familyId), user.id, 2);

    // 获取插入的消息
    const message = db.prepare(`
      SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at,
             u.name as user_name, u.avatar as user_avatar
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid as number);

    // 触发管家 AI（异步，不阻塞响应）
    triggerButlerReply(db, Number(familyId), message as any, user.name);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json({ success: false, error: '发送失败' }, { status: 500 });
  }
}

// ============ 管家 AI 觸發（非阻塞） ============

async function triggerButlerReply(
  db: any,
  familyId: number,
  currentMessage: { id: number; user_id: number; user_name: string; content: string; created_at: string },
  userName: string
) {
  try {
    // 动态导入，避免循环依赖
    const { isEnabled, detectTrigger, generateReply } = await import('@/plugins/family-butler');

    if (!isEnabled()) return;

    const triggerType = detectTrigger(currentMessage.content);
    if (triggerType === 'none') return;

    // 获取最近 30 条消息
    const messages = db.prepare(`
      SELECT cm.id, cm.user_id, u.name as user_name, cm.content, cm.created_at
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.family_id = ?
      ORDER BY cm.created_at DESC
      LIMIT 30
    `).all(familyId) as any[];

    // 反转按时间正序
    messages.reverse();

    // 生成 AI 回复
    const reply = await generateReply({
      db,
      familyId,
      messages,
      userMessage: currentMessage.content,
      userName: userName,
      triggerType,
      userId: currentMessage.user_id,
    });

    if (!reply) return;

    // 保存管家回复到数据库
    db.prepare(`
      INSERT INTO chat_messages (family_id, user_id, content, created_at)
      VALUES (?, 0, ?, datetime('now', ?))
    `).run(familyId, reply, `+${Math.random() * 0.001} seconds`);

    const botMsg = db.prepare(`
      SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at,
             '聊天室管家' as user_name,
             'https://api.dicebear.com/7.x/bottts/svg?seed=butler' as user_avatar
      FROM chat_messages cm
      WHERE cm.family_id = ? AND cm.user_id = 0
      ORDER BY cm.created_at DESC
      LIMIT 1
    `).get(familyId);

    // 通过 Socket.IO 广播管家消息
    const { socketManager } = await import('@/lib/socket');
    const io = socketManager.getIO();
    if (io && botMsg) {
      io.to(`family:${familyId}`).emit('chat-message', {
        messageId: (botMsg as any).id,
        userId: 0,
        userName: '聊天室管家',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=butler',
        content: (botMsg as any).content,
        createdAt: (botMsg as any).created_at,
        isButler: true,
      });
    }

    console.log(`[Butler] 家族 ${familyId} 管家回复已发送`);
  } catch (error) {
    console.error('[Butler] AI 触发失败:', error);
  }
}
