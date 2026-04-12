/**
 * 家族文档库插件
 * 提供文件上传、管理和分享功能
 */
import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface DocumentFolder {
  id: number;
  family_id: number;
  name: string;
  parent_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentFile {
  id: number;
  family_id: number;
  folder_id: number | null;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  description: string | null;
  uploaded_by: number;
  download_count: number;
  created_at: string;
  updated_at: string;
}

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_DOCUMENT_LIBRARY !== 'false' && process.env.DISABLE_PLUGIN_DOCUMENT_LIBRARY !== 'true';
}

// 初始化數據庫
export function initDatabase(db: Database.Database): void {
  if (!isEnabled()) return;
  try {
    const schemaPath = path.join(process.cwd(), 'plugins/document-library/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ 家族文檔庫插件數據庫初始化完成');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ 家族文檔庫插件數據庫已存在');
    } else {
      console.error('❌ 家族文檔庫插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

// ============ 文件夾操作 ============

export function createFolder(
  db: Database.Database,
  data: { family_id: number; name: string; parent_id?: number; created_by: number }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_document_folders (family_id, name, parent_id, created_by)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(data.family_id, data.name, data.parent_id || null, data.created_by);
  return Number(result.lastInsertRowid);
}

export function getFolders(db: Database.Database, familyId: number, parentId: number | null = null): DocumentFolder[] {
  return db.prepare(`
    SELECT * FROM plugin_document_folders
    WHERE family_id = ? AND parent_id IS ?
    ORDER BY name ASC
  `).all(familyId, parentId) as DocumentFolder[];
}

export function getFolder(db: Database.Database, id: number): DocumentFolder | null {
  return db.prepare('SELECT * FROM plugin_document_folders WHERE id = ?').get(id) as DocumentFolder | null;
}

export function updateFolder(db: Database.Database, id: number, name: string): boolean {
  const result = db.prepare(`
    UPDATE plugin_document_folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(name, id);
  return result.changes > 0;
}

export function deleteFolder(db: Database.Database, id: number): boolean {
  // 先刪除子文件夾和文件
  const files = db.prepare('SELECT id FROM plugin_document_files WHERE folder_id = ?').all(id);
  for (const file of files as { id: number }[]) {
    deleteFile(db, file.id);
  }
  
  const subFolders = db.prepare('SELECT id FROM plugin_document_folders WHERE parent_id = ?').all(id);
  for (const folder of subFolders as { id: number }[]) {
    deleteFolder(db, folder.id);
  }
  
  const result = db.prepare('DELETE FROM plugin_document_folders WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ 文件操作 ============

export function createFile(
  db: Database.Database,
  data: {
    family_id: number;
    folder_id?: number;
    name: string;
    original_name: string;
    file_type: string;
    file_size: number;
    file_path: string;
    description?: string;
    uploaded_by: number;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_document_files
    (family_id, folder_id, name, original_name, file_type, file_size, file_path, description, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.folder_id || null,
    data.name,
    data.original_name,
    data.file_type,
    data.file_size,
    data.file_path,
    data.description || null,
    data.uploaded_by
  );
  return Number(result.lastInsertRowid);
}

export function getFiles(db: Database.Database, familyId: number, folderId: number | null = null): DocumentFile[] {
  return db.prepare(`
    SELECT f.*, u.name as uploader_name
    FROM plugin_document_files f
    LEFT JOIN users u ON f.uploaded_by = u.id
    WHERE f.family_id = ? AND f.folder_id IS ?
    ORDER BY f.created_at DESC
  `).all(familyId, folderId) as DocumentFile[];
}

export function getFile(db: Database.Database, id: number): DocumentFile | null {
  return db.prepare(`
    SELECT f.*, u.name as uploader_name
    FROM plugin_document_files f
    LEFT JOIN users u ON f.uploaded_by = u.id
    WHERE f.id = ?
  `).get(id) as DocumentFile | null;
}

export function incrementDownloadCount(db: Database.Database, id: number): void {
  db.prepare('UPDATE plugin_document_files SET download_count = download_count + 1 WHERE id = ?').run(id);
}

export function updateFile(db: Database.Database, id: number, data: { name?: string; description?: string }): boolean {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.name) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  
  if (fields.length === 0) return false;
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const result = db.prepare(`UPDATE plugin_document_files SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteFile(db: Database.Database, id: number): boolean {
  const file = getFile(db, id);
  if (file) {
    // 刪除實際文件
    try {
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }
    } catch (error) {
      console.warn('刪除文件失敗:', error);
    }
  }
  
  const result = db.prepare('DELETE FROM plugin_document_files WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ 統計 ============

export function getStorageStats(db: Database.Database, familyId: number): { totalFiles: number; totalSize: number } {
  const result = db.prepare(`
    SELECT COUNT(*) as totalFiles, COALESCE(SUM(file_size), 0) as totalSize
    FROM plugin_document_files WHERE family_id = ?
  `).get(familyId) as { totalFiles: number; totalSize: number };
  return result;
}

export default {
  name: 'document-library',
  displayName: '家族文檔庫',
  description: '家族文件上傳、管理與分享',
  isEnabled,
  initDatabase,
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
  createFile,
  getFiles,
  getFile,
  incrementDownloadCount,
  updateFile,
  deleteFile,
  getStorageStats,
};
