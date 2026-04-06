import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isEnabled, createEvent, getFamilyEvents, getUpcomingEvents, updateEvent, deleteEvent, getEvent } from '@/plugins/event-calendar';

export async function GET(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '日曆插件未啟用' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const upcoming = searchParams.get('upcoming');

    if (!familyId) {
      return NextResponse.json({ error: '缺少家族 ID' }, { status: 400 });
    }

    const familyIdNum = Number(familyId);

    let events;
    if (upcoming === 'true') {
      events = getUpcomingEvents(db, familyIdNum, 10);
    } else {
      events = getFamilyEvents(db, familyIdNum, startDate || undefined, endDate || undefined);
    }

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('获取事件失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '日曆插件未啟用' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const { familyId, title, description, eventType, location, startAt, endAt, isAllDay } = body;

    if (!familyId || !title || !startAt) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const eventId = createEvent(db, {
      family_id: Number(familyId),
      title,
      description: description || null,
      event_type: eventType || 'general',
      location: location || null,
      start_at: startAt,
      end_at: endAt || null,
      is_all_day: isAllDay ? 1 : 0,
      is_recurring: 0,
      recurrence_rule: null,
      created_by: user.id,
    });

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error('创建事件失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '日曆插件未啟用' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少事件 ID' }, { status: 400 });
    }

    const success = updateEvent(db, Number(id), data);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('更新事件失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '日曆插件未啟用' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少事件 ID' }, { status: 400 });
    }

    const success = deleteEvent(db, Number(id));

    return NextResponse.json({ success });
  } catch (error) {
    console.error('删除事件失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
