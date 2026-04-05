/**
 * 家族管家 - AI 聊天回覆 API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUpcomingAnnouncements, getUpcomingReminders, isTodayHoliday } from '@/plugins/family-butler';
import { generateButlerReply } from '@/plugins/family-butler/ai-service';
import type { AIReplyRequest } from '@/plugins/family-butler/types';
import { getTodaysBirthdays } from '@/plugins/birthday-reminder';

export async function POST(request: Request) {
  try {
    const body = await request.json() as AIReplyRequest;
    const { familyId, message, recentMessages } = body;

    // 獲取上下文信息
    const upcomingEvents = getUpcomingAnnouncements(db, familyId);
    const upcomingReminders = getUpcomingReminders(db, familyId);
    const todaysBirthdays = getTodaysBirthdays(familyId);
    const { isHoliday, name: holidayName } = isTodayHoliday();

    // 構建上下文
    const context = {
      hasBirthdayToday: todaysBirthdays.length > 0,
      birthdayPerson: todaysBirthdays.length > 0 ? todaysBirthdays[0].title : undefined,
      isHoliday,
      holidayName: isHoliday ? holidayName : undefined,
      upcomingEvents,
      upcomingReminders,
    };

    // 生成 AI 回覆
    const reply = await generateButlerReply({
      ...body,
      context,
    });

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('[FamilyButler] 聊天回覆失敗:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
