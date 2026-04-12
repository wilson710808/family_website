import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 获取家族书单和笔记
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const type = searchParams.get('type') || 'books';
    const bookName = searchParams.get('bookName');

    if (!familyId) {
      return NextResponse.json({ error: '缺少 familyId' }, { status: 400 });
    }

    const fid = Number(familyId);

    if (type === 'books') {
      // 获取家族书单
      const books = db.prepare(`
        SELECT fb.*, u.name as recommender_name, u.avatar as recommender_avatar
        FROM plugin_growth_family_books fb
        LEFT JOIN users u ON fb.user_id = u.id
        WHERE fb.family_id = ?
        ORDER BY fb.is_featured DESC, fb.likes_count DESC, fb.created_at DESC
      `).all(fid);

      return NextResponse.json({ success: true, books });
    }

    if (type === 'notes') {
      // 获取读书笔记
      let query = `
        SELECT rn.*, u.name as author_name, u.avatar as author_avatar
        FROM plugin_growth_reading_notes rn
        LEFT JOIN users u ON rn.user_id = u.id
        WHERE rn.family_id = ? AND rn.is_shared = 1
      `;
      const params: any[] = [fid];

      if (bookName) {
        query += ' AND rn.book_name = ?';
        params.push(bookName);
      }

      query += ' ORDER BY rn.likes_count DESC, rn.created_at DESC';

      const notes = db.prepare(query).all(...params);

      return NextResponse.json({ success: true, notes });
    }

    if (type === 'stats') {
      // 获取统计
      const bookCount = db.prepare(`
        SELECT COUNT(*) FROM plugin_growth_family_books WHERE family_id = ?
      `).pluck().get(fid) as number;

      const noteCount = db.prepare(`
        SELECT COUNT(*) FROM plugin_growth_reading_notes WHERE family_id = ? AND is_shared = 1
      `).pluck().get(fid) as number;

      const memberCount = db.prepare(`
        SELECT COUNT(DISTINCT user_id) FROM plugin_growth_reading_notes WHERE family_id = ?
      `).pluck().get(fid) as number;

      return NextResponse.json({
        success: true,
        stats: { bookCount, noteCount, memberCount },
      });
    }

    if (type === 'comments') {
      const targetType = searchParams.get('targetType');
      const targetId = searchParams.get('targetId');

      if (!targetType || !targetId) {
        return NextResponse.json({ error: '缺少参数' }, { status: 400 });
      }

      const comments = db.prepare(`
        SELECT c.*, u.name as author_name, u.avatar as author_avatar
        FROM plugin_growth_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.target_type = ? AND c.target_id = ?
        ORDER BY c.created_at ASC
      `).all(targetType, Number(targetId));

      return NextResponse.json({ success: true, comments });
    }

    return NextResponse.json({ error: '未知类型' }, { status: 400 });
  } catch (error) {
    console.error('获取数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 添加书单或笔记
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, familyId, userId } = body;

    if (!familyId || !userId) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    if (type === 'book') {
      // 添加家族书单
      const { book_name, author, category, description, recommend_reason } = body;

      if (!book_name) {
        return NextResponse.json({ error: '缺少书名' }, { status: 400 });
      }

      try {
        const result = db.prepare(`
          INSERT INTO plugin_growth_family_books
          (family_id, user_id, book_name, author, category, description, recommend_reason)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(familyId, userId, book_name, author || null, category || null, description || null, recommend_reason || null);

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
      } catch (e: any) {
        if (e.message?.includes('UNIQUE')) {
          return NextResponse.json({ error: '此书已在家族书单中' }, { status: 400 });
        }
        throw e;
      }
    }

    if (type === 'note') {
      // 添加读书笔记
      const { book_name, chapter, note_type, content, page_number, is_shared } = body;

      if (!book_name || !content) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
      }

      const result = db.prepare(`
        INSERT INTO plugin_growth_reading_notes
        (family_id, user_id, book_name, chapter, note_type, content, page_number, is_shared)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        familyId,
        userId,
        book_name,
        chapter || null,
        note_type || 'thought',
        content,
        page_number || null,
        is_shared !== false ? 1 : 0
      );

      return NextResponse.json({ success: true, id: result.lastInsertRowid });
    }

    if (type === 'comment') {
      // 添加评论
      const { target_type, target_id, content } = body;

      if (!target_type || !target_id || !content) {
        return NextResponse.json({ error: '缺少参数' }, { status: 400 });
      }

      const result = db.prepare(`
        INSERT INTO plugin_growth_comments (family_id, user_id, target_type, target_id, content)
        VALUES (?, ?, ?, ?, ?)
      `).run(familyId, userId, target_type, target_id, content);

      return NextResponse.json({ success: true, id: result.lastInsertRowid });
    }

    return NextResponse.json({ error: '未知类型' }, { status: 400 });
  } catch (error) {
    console.error('添加失败:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}

// 点赞
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, targetId, userId, action } = body; // action: 'like' or 'unlike'

    if (!type || !targetId || !userId) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    if (type === 'book') {
      if (action === 'like') {
        try {
          db.prepare(`
            INSERT INTO plugin_growth_family_book_likes (family_book_id, user_id) VALUES (?, ?)
          `).run(targetId, userId);

          db.prepare(`
            UPDATE plugin_growth_family_books SET likes_count = likes_count + 1 WHERE id = ?
          `).run(targetId);

          return NextResponse.json({ success: true, liked: true });
        } catch {
          return NextResponse.json({ error: '已点赞' }, { status: 400 });
        }
      } else {
        db.prepare(`
          DELETE FROM plugin_growth_family_book_likes WHERE family_book_id = ? AND user_id = ?
        `).run(targetId, userId);

        db.prepare(`
          UPDATE plugin_growth_family_books SET likes_count = likes_count - 1 WHERE id = ?
        `).run(targetId);

        return NextResponse.json({ success: true, liked: false });
      }
    }

    if (type === 'note') {
      if (action === 'like') {
        try {
          db.prepare(`
            INSERT INTO plugin_growth_note_likes (note_id, user_id) VALUES (?, ?)
          `).run(targetId, userId);

          db.prepare(`
            UPDATE plugin_growth_reading_notes SET likes_count = likes_count + 1 WHERE id = ?
          `).run(targetId);

          return NextResponse.json({ success: true, liked: true });
        } catch {
          return NextResponse.json({ error: '已点赞' }, { status: 400 });
        }
      } else {
        db.prepare(`
          DELETE FROM plugin_growth_note_likes WHERE note_id = ? AND user_id = ?
        `).run(targetId, userId);

        db.prepare(`
          UPDATE plugin_growth_reading_notes SET likes_count = likes_count - 1 WHERE id = ?
        `).run(targetId);

        return NextResponse.json({ success: true, liked: false });
      }
    }

    return NextResponse.json({ error: '未知类型' }, { status: 400 });
  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// 删除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    if (type === 'book') {
      db.prepare('DELETE FROM plugin_growth_family_books WHERE id = ?').run(Number(id));
      db.prepare('DELETE FROM plugin_growth_family_book_likes WHERE family_book_id = ?').run(Number(id));
    } else if (type === 'note') {
      db.prepare('DELETE FROM plugin_growth_reading_notes WHERE id = ?').run(Number(id));
      db.prepare('DELETE FROM plugin_growth_note_likes WHERE note_id = ?').run(Number(id));
    } else if (type === 'comment') {
      db.prepare('DELETE FROM plugin_growth_comments WHERE id = ?').run(Number(id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
