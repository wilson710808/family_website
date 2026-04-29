import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// 文件类型白名单
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-rar-compressed',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    const formData = await request.formData();
    const familyId = formData.get('familyId');
    const folderId = formData.get('folderId');
    const description = formData.get('description');
    const file = formData.get('file') as File;

    if (!familyId || !file) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    const familyIdNum = Number(familyId);

    // 验证家族成员资格
    const inFamily = await isUserInFamily(user.id, familyIdNum);
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }

    // 验证文件类型
    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({
        error: `不支援的文件類型: ${mimeType}`,
        allowedTypes: 'PDF, Word, Excel, PPT, TXT, CSV, Markdown, 圖片, ZIP, RAR, 音頻, 視頻'
      }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小超過 20MB 限制' }, { status: 400 });
    }

    // 創建上傳目錄（使用异步操作）
    const uploadDir = path.join(UPLOAD_DIR, String(familyId));
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${timestamp}_${randomSuffix}.${ext}`;

    // 保存文件（异步）
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 保存到數據庫
    const result = db.prepare(`
      INSERT INTO plugin_document_files (family_id, folder_id, name, original_name, file_type, file_size, file_path, description, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      familyIdNum,
      folderId ? Number(folderId) : null,
      fileName,
      file.name,
      mimeType,
      file.size,
      `/uploads/documents/${familyId}/${fileName}`,
      description?.toString() || null,
      user.id
    );

    return NextResponse.json({ success: true, fileId: result.lastInsertRowid, fileName: file.name });
  } catch (error) {
    console.error('文件上傳失敗:', error);
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 });
  }
}
