/**
 * 家族管家 - 內容檢測 API
 * 包括：任務/提醒識別、情緒檢測
 */
import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';
import { detectTaskInMessage, detectNegativeSentiment } from '@/plugins/family-butler/ai-service';
import { createReminder } from '@/plugins/family-butler';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    const body = await request.json();
    const { type, message, messages, familyId, userId, userName } = body;

    if (!familyId) {
      return NextResponse.json({ success: false, error: '缺少 familyId' }, { status: 400 });
    }

    const inFamily = await isUserInFamily(user.id, Number(familyId));
    if (!inFamily) {
      return NextResponse.json({ success: false, error: '你不是該家族成員' }, { status: 403 });
    }

    if (type === 'task') {
      const result = await detectTaskInMessage(message);
      if (result.hasTask && result.confidence >= 0.7 && result.taskDate) {
        createReminder(db, {
          family_id: familyId,
          created_by: user.id,
          creator_name: user.name,
          content: result.taskContent || message,
          remind_date: result.taskDate,
          remind_time: result.taskTime || null,
        });
      }
      return NextResponse.json({ success: true, detection: result });
    }

    if (type === 'sentiment') {
      const result = await detectNegativeSentiment(messages);
      return NextResponse.json({ success: true, detection: result });
    }

    return NextResponse.json({ success: false, error: '不支持的檢測類型' }, { status: 400 });
  } catch (error) {
    console.error('[FamilyButler] 檢測失敗:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
