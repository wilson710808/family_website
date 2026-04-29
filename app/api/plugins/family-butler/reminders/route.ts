/**
 * 家族管家 - 提醒列表 API
 */
import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUpcomingReminders, createReminder } from '@/plugins/family-butler';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = Number(searchParams.get('familyId'));

    if (!familyId) {
      return NextResponse.json({ success: false, error: '缺少 familyId' }, { status: 400 });
    }

    const inFamily = await isUserInFamily(user.id, familyId);
    if (!inFamily) {
      return NextResponse.json({ success: false, error: '你不是該家族成員' }, { status: 403 });
    }

    const reminders = getUpcomingReminders(db, familyId);
    return NextResponse.json({ success: true, reminders });
  } catch (error) {
    console.error('[FamilyButler] 獲取提醒失敗:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, content, remindDate, remindTime } = body;

    if (!familyId || !content || !remindDate) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    const inFamily = await isUserInFamily(user.id, Number(familyId));
    if (!inFamily) {
      return NextResponse.json({ success: false, error: '你不是該家族成員' }, { status: 403 });
    }

    const id = createReminder(db, {
      family_id: familyId,
      created_by: user.id,
      creator_name: user.name,
      content,
      remind_date: remindDate,
      remind_time: remindTime || null,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[FamilyButler] 創建提醒失敗:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
