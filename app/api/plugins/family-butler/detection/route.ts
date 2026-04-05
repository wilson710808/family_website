/**
 * 家族管家 - 內容檢測 API
 * 包括：任務/提醒識別、情緒檢測
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectTaskInMessage, detectNegativeSentiment } from '@/plugins/family-butler/ai-service';
import { createReminder } from '@/plugins/family-butler';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, message, messages, familyId, userId, userName } = body;

    if (type === 'task') {
      // 檢測任務/提醒
      const result = await detectTaskInMessage(message);

      // 如果檢測到任務且置信度足夠，自動創建提醒
      if (result.hasTask && result.confidence >= 0.7 && result.taskDate) {
        createReminder(db, {
          family_id: familyId,
          created_by: userId,
          creator_name: userName,
          content: result.taskContent || message,
          remind_date: result.taskDate,
          remind_time: result.taskTime || null,
        });
      }

      return NextResponse.json({
        success: true,
        detection: result,
      });
    }

    if (type === 'sentiment') {
      // 檢測負面情緒/爭吵
      const result = await detectNegativeSentiment(messages);
      return NextResponse.json({
        success: true,
        detection: result,
      });
    }

    return NextResponse.json(
      { success: false, error: '不支持的檢測類型' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[FamilyButler] 檢測失敗:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
