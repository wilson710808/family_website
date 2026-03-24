import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../plugins/growth-column';
import Database from 'better-sqlite3';

// 获取收藏列表
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

    const favorites = db.prepare(`
      SELECT * FROM plugin_growth_book_favorites
      WHERE family_id = ? ${userId ? 'AND user_id = ?' : ''}
      ORDER BY created_at DESC
    `).all(familyId, ...(userId ? [userId] : []));

    db.close();

    return NextResponse.json({ success: true, favorites });
  } catch (error: any) {
    console.error('获取收藏失败:', error);
    return NextResponse.json(
      { error: '获取收藏失敗', message: error.message },
      { status: 500 }
    );
  }
}

// 添加收藏
export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  try {
    const { familyId, userId, bookName, author, category } = await request.json();
    const dbPath = process.env.DB_PATH || './family.db';
    const db = new Database(dbPath);

    // 检查是否已收藏
    const existing = db.prepare(`
      SELECT id FROM plugin_growth_book_favorites
      WHERE family_id = ? AND book_name = ? AND user_id = ?
    `).get(familyId || 1, bookName, userId || null);

    if (existing) {
      db.prepare(`
        DELETE FROM plugin_growth_book_favorites
        WHERE id = ?
      `).run((existing as any).id);
      db.close();
      return NextResponse.json({ success: true, action: 'removed' });
    }

    db.prepare(`
      INSERT INTO plugin_growth_book_favorites (family_id, user_id, book_name, author, category, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(familyId || 1, userId || null, bookName, author || null, category || null, 0);

    db.close();
    return NextResponse.json({ success: true, action: 'added' });
  } catch (error: any) {
    console.error('操作收藏失败:', error);
    return NextResponse.json(
      { error: '操作收藏失敗', message: error.message },
      { status: 500 }
    );
  }
}

// 删除收藏
export async function DELETE(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));

  try {
    const dbPath = process.env.DB_PATH || './family.db';
    const db = new Database(dbPath);

    db.prepare(`DELETE FROM plugin_growth_book_favorites WHERE id = ?`).run(id);
    db.close();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除收藏失败:', error);
    return NextResponse.json(
      { error: '删除收藏失敗', message: error.message },
      { status: 500 }
    );
  }
}

// 切换阅读状态
export async function PATCH(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  try {
    const { id, status } = await request.json();
    const dbPath = process.env.DB_PATH || './family.db';
    const db = new Database(dbPath);

    db.prepare(`
      UPDATE plugin_growth_book_favorites
      SET status = ?
      WHERE id = ?
    `).run(status, id);

    db.close();

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('更新阅读状态失败:', error);
    return NextResponse.json(
      { error: '更新閱讀狀態失敗', message: error.message },
      { status: 500 }
    );
  }
}
