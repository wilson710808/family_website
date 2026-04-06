import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { isEnabled, getFamilyMemories } from '@/plugins/family-butler';

const AI_CONFIG = {
  baseUrl: process.env.BUTLER_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.BUTLER_API_KEY || '',
  model: process.env.BUTLER_MODEL || 'meta/llama-3.1-8b-instruct',
};

const GREETING_PROMPT = `你是「小幫手」，一個溫暖智慧的家庭管家。

現在 {userName} 剛進入家族聊天室，這是他今天第一次來。
請給他一個溫暖的打招呼（1-2 句話即可）。

家族記憶：
{memories}

規則：
1. 如果有家族記憶，可以提及相關內容（如「今天是小明的生日！」）
2. 語氣溫暖自然，像家人一樣
3. 繁體中文
4. 不要太長，1-2 句話`;

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '管家插件未启用' }, { status: 404 });
  }

  try {
    const { familyId, userName } = await request.json();

    if (!familyId || !userName) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    // 获取家族记忆
    const memories = getFamilyMemories(db, Number(familyId));

    // 生成 AI 打招呼
    let greeting: string;

    if (AI_CONFIG.apiKey) {
      try {
        const prompt = GREETING_PROMPT
          .replace('{userName}', userName)
          .replace('{memories}', memories);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          },
          body: JSON.stringify({
            model: AI_CONFIG.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 100,
          }),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          greeting = data.choices?.[0]?.message?.content?.trim();
        } else {
          greeting = getRandomGreeting(userName);
        }
      } catch {
        greeting = getRandomGreeting(userName);
      }
    } else {
      greeting = getRandomGreeting(userName);
    }

    // 保存管家消息到数据库
    db.prepare(`
      INSERT INTO chat_messages (family_id, user_id, content)
      VALUES (?, 0, ?)
    `).run(Number(familyId), greeting);

    // 获取消息 ID
    const botMsg = db.prepare(`
      SELECT id, content, created_at FROM chat_messages
      WHERE family_id = ? AND user_id = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(Number(familyId)) as { id: number; content: string; created_at: string } | undefined;

    // Socket 广播
    const { socketManager } = await import('@/lib/socket');
    const io = socketManager.getIO();
    if (io && botMsg) {
      io.to(`family:${familyId}`).emit('chat-message', {
        messageId: botMsg.id,
        userId: 0,
        userName: '聊天室管家',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=butler',
        content: botMsg.content,
        createdAt: botMsg.created_at,
        isButler: true,
      });
    }

    return NextResponse.json({ success: true, greeting });
  } catch (error) {
    console.error('管家打招呼失败:', error);
    return NextResponse.json({ error: '打招呼失败' }, { status: 500 });
  }
}

function getRandomGreeting(userName: string): string {
  const greetings = [
    `🎉 ${userName} 來了！歡迎歡迎～ 今天過得怎麼樣呀？😊`,
    `👋 ${userName} 好呀！很高興你今天來聊天室，快來跟大家聊聊吧！`,
    `🌟 ${userName} 歡迎回來！有什麼有趣的事想分享嗎？`,
    `💖 ${userName} 來啦！今天天氣真好，心情也不錯吧？`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
