/**
 * 生日提醒插件 API - 用户设置
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isEnabled, getUserSettings, setUserSettings } from '@/plugins/birthday-reminder';

export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { searchParams } = new URL(request.url);
    const familyId = Number(searchParams.get('familyId'));

    if (!familyId) {
      return NextResponse.json({ error: 'familyId required' }, { status: 400 });
    }

    const settings = getUserSettings(familyId, user.id);
    
    // 如果没有设置，返回默认值
    const defaultSettings = {
      remind_days_before: 1,
      notify_on_birthday_day: 1,
      is_enabled: 1
    };

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings
    });
  } catch (error) {
    console.error('[Birthday Settings API] GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: 'Plugin disabled' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const body = await request.json();
    const { familyId, ...settings } = body;

    setUserSettings(familyId, user.id, {
      remind_days_before: settings.remind_days_before ?? 1,
      notify_on_birthday_day: settings.notify_on_birthday_day ?? 1,
      is_enabled: settings.is_enabled ?? 1
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Birthday Settings API] POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
