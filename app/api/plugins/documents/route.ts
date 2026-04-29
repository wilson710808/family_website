import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';
import path from 'path';

// 获取文件夹和文件列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const folderId = searchParams.get('folderId');

    if (!familyId) {
      return NextResponse.json({ error: '缺少 familyId' }, { status: 400 });
    }

    const inFamily = await isUserInFamily(user.id, Number(familyId));
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }

    // 获取文件夹
    const folders = db.prepare(`
      SELECT f.*, u.name as creator_name
      FROM plugin_document_folders f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.family_id = ? AND f.parent_id IS ?
      ORDER BY f.name ASC
    `).all(Number(familyId), folderId ? Number(folderId) : null);

    // 获取文件
    const files = db.prepare(`
      SELECT f.*, u.name as uploader_name
      FROM plugin_document_files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.family_id = ? AND f.folder_id IS ?
      ORDER BY f.created_at DESC
    `).all(Number(familyId), folderId ? Number(folderId) : null);

    // 获取统计
    const stats = db.prepare(`
      SELECT COUNT(*) as totalFiles, COALESCE(SUM(file_size), 0) as totalSize
      FROM plugin_document_files WHERE family_id = ?
    `).get(Number(familyId)) as { totalFiles: number; totalSize: number };

    return NextResponse.json({ success: true, folders, files, stats });
  } catch (error) {
    console.error('获取文档列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 创建文件夹
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, name, parentId, type } = body;

    if (!familyId || !name) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    const inFamily = await isUserInFamily(user.id, Number(familyId));
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }

    if (type === 'folder') {
      const result = db.prepare(`
        INSERT INTO plugin_document_folders (family_id, name, parent_id, created_by)
        VALUES (?, ?, ?, ?)
      `).run(familyId, name, parentId || null, user.id);

      return NextResponse.json({ success: true, folderId: result.lastInsertRowid });
    }

    return NextResponse.json({ error: '未知操作類型' }, { status: 400 });
  } catch (error) {
    console.error('创建失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

// 删除文件夹或文件
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'folder' or 'file'
    const id = searchParams.get('id');
    const familyId = searchParams.get('familyId');

    if (!type || !id || !familyId) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    const inFamily = await isUserInFamily(user.id, Number(familyId));
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }

    if (type === 'folder') {
      // 递归删除
      const deleteFolderRecursive = (folderId: number) => {
        // 删除子文件
        const files = db.prepare('SELECT id, file_path FROM plugin_document_files WHERE folder_id = ?').all(folderId) as { id: number; file_path: string }[];
        for (const file of files) {
          // 修复：拼接物理路径
          const physicalPath = path.join(process.cwd(), file.file_path);
          try {
            const fs = require('fs');
            if (fs.existsSync(physicalPath)) {
              fs.unlinkSync(physicalPath);
            }
          } catch {}
          db.prepare('DELETE FROM plugin_document_files WHERE id = ?').run(file.id);
        }
        // 删除子文件夹
        const subFolders = db.prepare('SELECT id FROM plugin_document_folders WHERE parent_id = ?').all(folderId) as { id: number }[];
        for (const sub of subFolders) {
          deleteFolderRecursive(sub.id);
        }
        db.prepare('DELETE FROM plugin_document_folders WHERE id = ?').run(folderId);
      };
      deleteFolderRecursive(Number(id));
    } else if (type === 'file') {
      const file = db.prepare('SELECT file_path FROM plugin_document_files WHERE id = ?').get(Number(id)) as { file_path: string } | undefined;
      if (file) {
        // 修复：拼接物理路径
        const physicalPath = path.join(process.cwd(), file.file_path);
        try {
          const fs = require('fs');
          if (fs.existsSync(physicalPath)) {
            fs.unlinkSync(physicalPath);
          }
        } catch {}
      }
      db.prepare('DELETE FROM plugin_document_files WHERE id = ?').run(Number(id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
