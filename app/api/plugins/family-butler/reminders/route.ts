/**
 * 家族管家 - 提醒列表 API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUpcomingReminders, createReminder } from '@/plugins/family-butler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = Number(searchParams.get('familyId'));

    if (!familyId) {
      return NextResponse.json(
        { success: false, error: '缺少 familyId' },
        { status: 400 }
      );
    }

    const reminders = getUpcomingReminders(db, familyId);

    return NextResponse.json({
      success: true,
      reminders,
    });
  } catch (error) {
    console.error('[FamilyButler] 獲取提醒失敗:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { familyId, userId, userName, content, remindDate, remindTime } = body;

    if (!familyId || !content || !remindDate) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const id = createReminder(db, {
      family_id: familyId,
      created_by: userId,
      creator_name: userName,
      content,
      remind_date: remindDate,
      remind_time: remindTime || null,
    });

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error('[FamilyButler] 創建提醒失敗:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
