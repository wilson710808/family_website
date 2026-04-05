/**
 * 生日提醒插件 API - 获取提醒列表
 * 可插拔设计：如果插件禁用，返回 404 即可
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  isEnabled, 
  getFamilyReminders, 
  getUpcomingReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  BirthdayReminder
} from '@/plugins/birthday-reminder';

if (isEnabled()) {
  // 插件启用时初始化
  import('@/plugins/birthday-reminder').then(({ initDatabase }) => {
    initDatabase();
  });
}

export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const familyId = Number(searchParams.get('familyId'));
    const upcoming = searchParams.get('upcoming') === 'true';
    const daysAhead = Number(searchParams.get('daysAhead') || '30');

    if (!familyId) {
      return NextResponse.json({ error: 'familyId required' }, { status: 400 });
    }

    let reminders;
    if (upcoming) {
      reminders = getUpcomingReminders(familyId, daysAhead);
    } else {
      reminders = getFamilyReminders(familyId);
    }

    return NextResponse.json({
      success: true,
      enabled: true,
      reminders,
      upcoming
    });
  } catch (error) {
    console.error('[Birthday API] GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    
    const id = addReminder({
      user_id: body.user_id || user.id,
      family_id: body.family_id,
      reminder_type: body.reminder_type || 'birthday',
      title: body.title,
      birth_date: body.birth_date,
      year: body.year || null,
      is_enabled: 1
    });

    return NextResponse.json({
      success: true,
      id
    });
  } catch (error) {
    console.error('[Birthday API] POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const body = await request.json();

    const success = updateReminder(id, body);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Birthday API] PUT error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    const success = deleteReminder(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Birthday API] DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
