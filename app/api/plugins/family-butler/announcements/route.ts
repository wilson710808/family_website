/**
 * 家族管家 - 公告 API
 */
import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAnnouncement, getUpcomingAnnouncements } from '@/plugins/family-butler';

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

    const announcements = getUpcomingAnnouncements(db, familyId);
    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error('[FamilyButler] 獲取公告失敗:', error);
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
    const { familyId, title, content, eventDate, eventTime, notifyDaysBefore = 3 } = body;

    if (!familyId || !title || !content || !eventDate) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    const inFamily = await isUserInFamily(user.id, Number(familyId));
    if (!inFamily) {
      return NextResponse.json({ success: false, error: '你不是該家族成員' }, { status: 403 });
    }

    const id = createAnnouncement(db, {
      family_id: familyId,
      user_id: user.id,
      creator_name: user.name,
      title,
      content,
      event_date: eventDate,
      event_time: eventTime || null,
      notify_days_before: notifyDaysBefore,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[FamilyButler] 創建公告失敗:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
