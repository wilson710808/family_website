import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.is_admin !== 1) {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const families = db.prepare(`
      SELECT f.*, u.name as creator_name, COUNT(fm.id) as member_count
      FROM families f
      JOIN users u ON f.creator_id = u.id
      LEFT JOIN family_members fm ON f.id = fm.family_id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `).all() as any[];

    return NextResponse.json({
      success: true,
      families,
    });
  } catch (error) {
    console.error('获取家族列表失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
