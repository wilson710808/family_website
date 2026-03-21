/**
 * 家族相册插件
 * 可插拔设计 - 通过环境变量 PLUGIN_FAMILY_ALBUM 控制开关
 * 默认启用，设置 false/0/1 即可禁用
 */

import { db } from '../../lib/db';

export interface Album {
  id: number;
  family_id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_by: number;
  is_public: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  album_id: number;
  family_id: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  title: string | null;
  description: string | null;
  tags: string | null; // JSON string
  uploaded_by: number;
  upload_date: string;
  taken_at: string | null;
  is_enabled: number;
}

export interface PhotoComment {
  id: number;
  photo_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

// 检查插件是否启用
export function isEnabled(): boolean {
  return process.env.PLUGIN_FAMILY_ALBUM !== 'false' && 
         process.env.PLUGIN_FAMILY_ALBUM !== '0' &&
         process.env.DISABLE_PLUGIN_FAMILY_ALBUM !== '1' &&
         process.env.DISABLE_PLUGIN_FAMILY_ALBUM !== 'true';
}

// 初始化数据库
export function initDatabase() {
  if (!isEnabled()) return;
  
  try {
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='plugin_album_albums'
    `).get();
    
    if (!tableExists) {
      const schema = require('fs').readFileSync(
        require('path').join(__dirname, 'schema.sql'), 
        'utf8'
      );
      db.exec(schema);
      console.log('[FamilyAlbumPlugin] 数据库初始化完成');
    }
  } catch (error) {
    console.error('[FamilyAlbumPlugin] 初始化失败:', error);
  }
}

// === 相册操作 ===

// 创建相册
export function createAlbum(album: Omit<Album, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_album_albums 
    (family_id, title, description, cover_image, created_by, is_public)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    album.family_id,
    album.title,
    album.description,
    album.cover_image,
    album.created_by,
    album.is_public
  );
  return Number(result.lastInsertRowid);
}

// 更新相册
export function updateAlbum(
  id: number,
  data: Partial<Omit<Album, 'id' | 'created_at'>>
): boolean {
  const fields = Object.keys(data).map(k => `${k} = ?, updated_at = CURRENT_TIMESTAMP`).join(', ');
  const values = Object.values(data);
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE plugin_album_albums SET ${fields} WHERE id = ?
  `);
  const result = stmt.run(values);
  return result.changes > 0;
}

// 删除相册
export function deleteAlbum(id: number): boolean {
  // 先删除相册中所有照片，再删除相册
  db.prepare('DELETE FROM plugin_album_photos WHERE album_id = ?').run(id);
  const result = db.prepare('DELETE FROM plugin_album_albums WHERE id = ?').run(id);
  return result.changes > 0;
}

// 获取家族所有相册
export function getFamilyAlbums(familyId: number): Album[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_album_albums 
    WHERE family_id = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(familyId) as Album[];
}

// 获取单个相册
export function getAlbum(albumId: number): Album | null {
  const stmt = db.prepare('SELECT * FROM plugin_album_albums WHERE id = ?');
  return stmt.get(albumId) as Album | null;
}

// === 照片操作 ===

// 添加照片
export function addPhoto(photo: Omit<Photo, 'id' | 'upload_date' | 'is_enabled'>): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_album_photos 
    (album_id, family_id, file_path, file_name, file_size, width, height, title, description, tags, uploaded_by, taken_at, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const result = stmt.run(
    photo.album_id,
    photo.family_id,
    photo.file_path,
    photo.file_name,
    photo.file_size,
    photo.width,
    photo.height,
    photo.title,
    photo.description,
    photo.tags,
    photo.uploaded_by,
    photo.taken_at
  );
  // 更新相册封面，如果还没有的话
  const album = getAlbum(photo.album_id);
  if (album && !album.cover_image) {
    updateAlbum(photo.album_id, { cover_image: photo.file_path });
  }
  return Number(result.lastInsertRowid);
}

// 删除照片
export function deletePhoto(id: number): boolean {
  const result = db.prepare('DELETE FROM plugin_album_photos WHERE id = ?').run(id);
  // 删除点赞和评论
  db.prepare('DELETE FROM plugin_album_likes WHERE photo_id = ?').run(id);
  db.prepare('DELETE FROM plugin_album_comments WHERE photo_id = ?').run(id);
  return result.changes > 0;
}

// 获取相册所有照片
export function getAlbumPhotos(albumId: number, limit?: number, offset?: number): Photo[] {
  let sql = `
    SELECT * FROM plugin_album_photos 
    WHERE album_id = ? AND is_enabled = 1
    ORDER BY upload_date DESC
  `;
  if (limit) {
    sql += ` LIMIT ${limit}`;
    if (offset) sql += ` OFFSET ${offset}`;
  }
  const stmt = db.prepare(sql);
  return stmt.all(albumId) as Photo[];
}

// 获取家族最近照片（用于首页展示）
export function getRecentPhotos(familyId: number, limit: number = 12): Photo[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_album_photos 
    WHERE family_id = ? AND is_enabled = 1
    ORDER BY upload_date DESC
    LIMIT ?
  `);
  return stmt.all(familyId, limit) as Photo[];
}

// 统计相册照片数量
export function countAlbumPhotos(albumId: number): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM plugin_album_photos WHERE album_id = ? AND is_enabled = 1
  `);
  const result = stmt.get(albumId) as { count: number };
  return result.count;
}

// === 点赞操作 ===

export function toggleLike(photoId: number, userId: number): boolean {
  const existing = db.prepare(`
    SELECT id FROM plugin_album_likes WHERE photo_id = ? AND user_id = ?
  `).get(photoId, userId);
  
  if (existing) {
    db.prepare('DELETE FROM plugin_album_likes WHERE id = ?').run((existing as any).id);
    return false; // 取消点赞
  } else {
    db.prepare('INSERT INTO plugin_album_likes (photo_id, user_id) VALUES (?, ?)').run(photoId, userId);
    return true; // 添加点赞
  }
}

export function getPhotoLikes(photoId: number): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM plugin_album_likes WHERE photo_id = ?');
  return (stmt.get(photoId) as any).count;
}

export function hasUserLiked(photoId: number, userId: number): boolean {
  return !!db.prepare('SELECT id FROM plugin_album_likes WHERE photo_id = ? AND user_id = ?').get(photoId, userId);
}

// === 评论操作 ===

export function addComment(photoId: number, userId: number, content: string): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_album_comments (photo_id, user_id, content) VALUES (?, ?, ?)
  `);
  const result = stmt.run(photoId, userId, content);
  return Number(result.lastInsertRowid);
}

export function deleteComment(id: number): boolean {
  const result = db.prepare('DELETE FROM plugin_album_comments WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getPhotoComments(photoId: number): PhotoComment[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_album_comments 
    WHERE photo_id = ? AND is_enabled = 1
    ORDER BY created_at DESC
  `);
  return stmt.all(photoId) as PhotoComment[];
}

export default {
  isEnabled,
  initDatabase,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getFamilyAlbums,
  getAlbum,
  addPhoto,
  deletePhoto,
  getAlbumPhotos,
  getRecentPhotos,
  countAlbumPhotos,
  toggleLike,
  getPhotoLikes,
  hasUserLiked,
  addComment,
  deleteComment,
  getPhotoComments
};
