import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isEnabled, detectTrigger, generateReply } from '@/plugins/family-butler';

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '管家插件未启用' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    const { familyId, content } = await request.json();

    if (!familyId || !content?.trim()) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const triggerType = detectTrigger(content);
    const familyIdNum = Number(familyId);

    // 获取最近 30 条消息
    const messages = db.prepare(`
      SELECT cm.id, cm.user_id, u.name as user_name, cm.content, cm.created_at
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.family_id = ?
      ORDER BY cm.created_at DESC
      LIMIT 30
    `).all(familyIdNum) as any[];

    messages.reverse();

    const reply = await generateReply({
      db,
      familyId: familyIdNum,
      messages,
      userMessage: content,
      userName: user.name,
      triggerType,
      userId: user.id,
    });

    if (!reply) {
      return NextResponse.json({ success: true, reply: null, triggerType, message: '无需回复' });
    }

    // 保存管家消息
    db.prepare(`
      INSERT INTO chat_messages (family_id, user_id, content)
      VALUES (?, 0, ?)
    `).run(familyIdNum, reply);

    const botMsg = db.prepare(`
      SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at,
             '聊天室管家' as user_name,
             'https://api.dicebear.com/7.x/bottts/svg?seed=butler' as user_avatar
      FROM chat_messages cm
      WHERE cm.family_id = ? AND cm.user_id = 0
      ORDER BY cm.created_at DESC LIMIT 1
    `).get(familyIdNum);

    // Socket 广播
    const { socketManager } = await import('@/lib/socket');
    const io = socketManager.getIO();
    if (io && botMsg) {
      io.to(`family:${familyIdNum}`).emit('chat-message', {
        messageId: (botMsg as any).id,
        userId: 0,
        userName: '聊天室管家',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=butler',
        content: (botMsg as any).content,
        createdAt: (botMsg as any).created_at,
        isButler: true,
      });
    }

    return NextResponse.json({ success: true, reply, triggerType });
  } catch (error) {
    console.error('管家回复失败:', error);
    return NextResponse.json({ error: '管家回复失败' }, { status: 500 });
  }
}
