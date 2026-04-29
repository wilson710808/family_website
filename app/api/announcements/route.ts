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

    const announcements = db.prepare(`
      SELECT a.*, u.name as user_name, f.name as family_name
      FROM announcements a
      JOIN users u ON a.user_id = u.id
      JOIN families f ON a.family_id = f.id
      WHERE a.family_id = ?
      ORDER BY a.created_at DESC
    `).all(familyIdNum);

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error('獲取公告接口錯誤:', error);
    return NextResponse.json({ success: false, error: '服務器錯誤' }, { status: 500 });
  }
}
