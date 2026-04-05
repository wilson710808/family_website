import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../plugins/growth-column';
import Database from 'better-sqlite3';

export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const familyId = Number(searchParams.get('familyId')) || 1;
  const userId = searchParams.get('userId');

  try {
    const dbPath = process.env.DB_PATH || './family.db';
    const db = new Database(dbPath);

    const history = db.prepare(`
      SELECT * FROM plugin_growth_book_history
      WHERE family_id = ? ${userId ? 'AND user_id = ?' : ''}
      ORDER BY created_at DESC
      LIMIT 20
    `).all(familyId, ...(userId ? [userId] : []));

    db.close();

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('获取历史失败:', error);
    return NextResponse.json(
      { error: '获取历史失敗', message: error.message },
      { status: 500 }
    );
  }
}
