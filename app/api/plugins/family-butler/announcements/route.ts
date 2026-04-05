/**
 * 家族管家 - 公告 API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAnnouncement, getUpcomingAnnouncements } from '@/plugins/family-butler';

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

    const announcements = getUpcomingAnnouncements(db, familyId);

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error('[FamilyButler] 獲取公告失敗:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      familyId,
      userId,
      userName,
      title,
      content,
      eventDate,
      eventTime,
      notifyDaysBefore = 3,
    } = body;

    if (!familyId || !title || !content || !eventDate) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const id = createAnnouncement(db, {
      family_id: familyId,
      user_id: userId,
      creator_name: userName,
      title,
      content,
      event_date: eventDate,
      event_time: eventTime || null,
      notify_days_before: notifyDaysBefore,
    });

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error('[FamilyButler] 創建公告失敗:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
