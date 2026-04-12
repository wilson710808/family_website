/**
 * 成长专栏社交化扩展
 * 家族书单共享、读书笔记分享、评论点赞
 */
import type Database from 'better-sqlite3';

// ============ 家族书单 ============

export function addFamilyBook(
  db: Database.Database,
  data: {
    family_id: number;
    user_id: number;
    book_name: string;
    author?: string;
    category?: string;
    description?: string;
    recommend_reason?: string;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_growth_family_books
    (family_id, user_id, book_name, author, category, description, recommend_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.user_id,
    data.book_name,
    data.author || null,
    data.category || null,
    data.description || null,
    data.recommend_reason || null
  );
  return Number(result.lastInsertRowid);
}

export function getFamilyBooks(db: Database.Database, familyId: number): any[] {
  return db.prepare(`
    SELECT fb.*, u.name as recommender_name, u.avatar as recommender_avatar
    FROM plugin_growth_family_books fb
    LEFT JOIN users u ON fb.user_id = u.id
    WHERE fb.family_id = ?
    ORDER BY fb.is_featured DESC, fb.likes_count DESC, fb.created_at DESC
  `).all(familyId);
}

export function likeFamilyBook(db: Database.Database, familyBookId: number, userId: number): boolean {
  try {
    db.prepare(`
      INSERT INTO plugin_growth_family_book_likes (family_book_id, user_id)
      VALUES (?, ?)
    `).run(familyBookId, userId);
    
    db.prepare(`
      UPDATE plugin_growth_family_books SET likes_count = likes_count + 1 WHERE id = ?
    `).run(familyBookId);
    return true;
  } catch {
    return false;
  }
}

export function unlikeFamilyBook(db: Database.Database, familyBookId: number, userId: number): boolean {
  const result = db.prepare(`
    DELETE FROM plugin_growth_family_book_likes WHERE family_book_id = ? AND user_id = ?
  `).run(familyBookId, userId);
  
  if (result.changes > 0) {
    db.prepare(`
      UPDATE plugin_growth_family_books SET likes_count = likes_count - 1 WHERE id = ?
    `).run(familyBookId);
  }
  return result.changes > 0;
}

// ============ 读书笔记 ============

export function createReadingNote(
  db: Database.Database,
  data: {
    family_id: number;
    user_id: number;
    book_name: string;
    chapter?: string;
    note_type?: string;
    content: string;
    page_number?: number;
    is_shared?: boolean;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_growth_reading_notes
    (family_id, user_id, book_name, chapter, note_type, content, page_number, is_shared)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.user_id,
    data.book_name,
    data.chapter || null,
    data.note_type || 'thought',
    data.content,
    data.page_number || null,
    data.is_shared !== false ? 1 : 0
  );
  return Number(result.lastInsertRowid);
}

export function getReadingNotes(db: Database.Database, familyId: number, bookName?: string): any[] {
  let query = `
    SELECT rn.*, u.name as author_name, u.avatar as author_avatar
    FROM plugin_growth_reading_notes rn
    LEFT JOIN users u ON rn.user_id = u.id
    WHERE rn.family_id = ? AND rn.is_shared = 1
  `;
  const params: any[] = [familyId];
  
  if (bookName) {
    query += ' AND rn.book_name = ?';
    params.push(bookName);
  }
  
  query += ' ORDER BY rn.likes_count DESC, rn.created_at DESC';
  
  return db.prepare(query).all(...params);
}

export function getUserNotes(db: Database.Database, userId: number): any[] {
  return db.prepare(`
    SELECT * FROM plugin_growth_reading_notes
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);
}

export function likeReadingNote(db: Database.Database, noteId: number, userId: number): boolean {
  try {
    db.prepare(`
      INSERT INTO plugin_growth_note_likes (note_id, user_id) VALUES (?, ?)
    `).run(noteId, userId);
    
    db.prepare(`
      UPDATE plugin_growth_reading_notes SET likes_count = likes_count + 1 WHERE id = ?
    `).run(noteId);
    return true;
  } catch {
    return false;
  }
}

// ============ 评论 ============

export function addComment(
  db: Database.Database,
  data: {
    family_id: number;
    user_id: number;
    target_type: string;
    target_id: number;
    content: string;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_growth_comments (family_id, user_id, target_type, target_id, content)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.user_id,
    data.target_type,
    data.target_id,
    data.content
  );
  return Number(result.lastInsertRowid);
}

export function getComments(db: Database.Database, targetType: string, targetId: number): any[] {
  return db.prepare(`
    SELECT c.*, u.name as author_name, u.avatar as author_avatar
    FROM plugin_growth_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.target_type = ? AND c.target_id = ?
    ORDER BY c.created_at ASC
  `).all(targetType, targetId);
}

// ============ 统计 ============

export function getFamilyReadingStats(db: Database.Database, familyId: number): any {
  const bookCount = db.prepare(`
    SELECT COUNT(*) as count FROM plugin_growth_family_books WHERE family_id = ?
  `).pluck().get(familyId) as number;

  const noteCount = db.prepare(`
    SELECT COUNT(*) as count FROM plugin_growth_reading_notes WHERE family_id = ? AND is_shared = 1
  `).pluck().get(familyId) as number;

  const memberCount = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM plugin_growth_reading_notes WHERE family_id = ?
  `).pluck().get(familyId) as number;

  return { bookCount, noteCount, memberCount };
}

export default {
  addFamilyBook,
  getFamilyBooks,
  likeFamilyBook,
  unlikeFamilyBook,
  createReadingNote,
  getReadingNotes,
  getUserNotes,
  likeReadingNote,
  addComment,
  getComments,
  getFamilyReadingStats,
};
