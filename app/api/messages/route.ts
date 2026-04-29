import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json({ success: false, error: '缺少 familyId 參數' }, { status: 400 });
    }

    const familyIdNum = parseInt(familyId);
    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '無效的家族ID' }, { status: 400 });
    }

    const inFamily = await isUserInFamily(user.id, familyIdNum);
    if (!inFamily) {
      return NextResponse.json({ success: false, error: '你不是該家族成員' }, { status: 403 });
    }

    const messages = db.prepare(
      `SELECT m.*, u.name as user_name, u.avatar as user_avatar
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.family_id = ?
       ORDER BY m.created_at DESC`
    ).all(familyIdNum);

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('獲取留言接口錯誤:', error);
    return NextResponse.json({ success: false, error: '服務器錯誤' }, { status: 500 });
  }
}
