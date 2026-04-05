import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../plugins/growth-column';
import Database from 'better-sqlite3';

// 从收藏缓存获取已保存的导览
export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  const familyId = Number(searchParams.get('familyId')) || 1;
  const bookName = searchParams.get('bookName');

  try {
    const dbPath = process.env.DB_PATH || './family.db';
    const db = new Database(dbPath);

    let favorite;
    if (id && id > 0) {
      favorite = db.prepare(`
        SELECT * FROM plugin_growth_book_favorites
        WHERE id = ? AND family_id = ?
      `).get(id, familyId);
    } else if (bookName) {
      favorite = db.prepare(`
        SELECT * FROM plugin_growth_book_favorites
        WHERE book_name = ? AND family_id = ?
      `).get(bookName.trim(), familyId);
    }

    if (!favorite) {
      db.close();
      return NextResponse.json(
        { error: '未找到收藏', found: false },
        { status: 404 }
      );
    }

    const bookTitle = (favorite as any).book_name;

    // 优先级 1: 如果收藏本身有缓存的完整导览，直接返回
    if ((favorite as any).full_guide) {
      try {
        const fullGuide = JSON.parse((favorite as any).full_guide);
        db.close();
        return NextResponse.json({
          success: true,
          found: true,
          cached: true,
          cacheSource: 'favorite',
          data: fullGuide,
          favoriteId: (favorite as any).id,
          status: (favorite as any).status
        });
      } catch (parseError) {
        console.warn('解析收藏缓存的JSON失败:', parseError);
        // 解析失败，fallthrough 检查全局缓存
      }
    }

    // 优先级 2: 检查全局公用缓存（所有用户共享的已生成导览）
    const globalCache = db.prepare(`
      SELECT full_guide FROM plugin_growth_global_guide_cache
      WHERE book_name = ?
    `).get(bookTitle);

    if (globalCache && (globalCache as any).full_guide) {
      try {
        const fullGuide = JSON.parse((globalCache as any).full_guide);
        db.close();
        console.log(`[FavoriteGuide] 从全局公用缓存读取: ${bookTitle}`);
        return NextResponse.json({
          success: true,
          found: true,
          cached: true,
          cacheSource: 'global',
          data: fullGuide,
          favoriteId: (favorite as any).id,
          status: (favorite as any).status
        });
      } catch (parseError) {
        console.warn('解析全局缓存的JSON失败:', parseError);
        // 解析失败，fallthrough
      }
    }

    // 没有任何缓存，返回基本信息让前端跳转到搜索页重新生成
    db.close();
    return NextResponse.json({
      success: true,
      found: true,
      cached: false,
      cacheSource: null,
      data: null,
      favoriteId: (favorite as any).id,
      bookName: (favorite as any).book_name,
      author: (favorite as any).author,
      category: (favorite as any).category,
      status: (favorite as any).status
    });
  } catch (error: any) {
    console.error('获取收藏导览失败:', error);
    return NextResponse.json(
      { error: '获取收藏导览失敗', message: error.message },
      { status: 500 }
    );
  }
}
