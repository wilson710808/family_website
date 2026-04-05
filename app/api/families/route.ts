import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    // 獲取用戶加入的所有家族
    const families = db.prepare(`
      SELECT f.id, f.name, f.description, f.created_at
      FROM family_members fm
      JOIN families f ON fm.family_id = f.id
      WHERE fm.user_id = ?
      ORDER BY f.created_at DESC
    `).all(user.id);

    return NextResponse.json({
      success: true,
      families,
    });
  } catch (error) {
    console.error('獲取家族列表失敗:', error);
    return NextResponse.json({ success: false, error: '獲取失敗' }, { status: 500 });
  }
}
