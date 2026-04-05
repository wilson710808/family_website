/**
 * 生日提醒插件 API - 获取即将到来的提醒（供首页仪表板调用）
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isEnabled, getUpcomingReminders, getTodaysBirthdays } from '@/plugins/birthday-reminder';

export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ enabled: false, reminders: [] }, { status: 200 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const familyId = Number(searchParams.get('familyId'));
    const daysAhead = Number(searchParams.get('daysAhead') || '30');

    if (!familyId) {
      return NextResponse.json({ error: 'familyId required' }, { status: 400 });
    }

    const reminders = getUpcomingReminders(familyId, daysAhead);
    const todays = getTodaysBirthdays(familyId);

    return NextResponse.json({
      success: true,
      enabled: true,
      reminders,
      todays,
      count: reminders.length
    });
  } catch (error) {
    console.error('[Birthday Upcoming API] GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
