import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// 配置不使用 body parser（用于文件上传）
export const config = {
  api: {
    bodyParser: false,
  },
};

// 文件上传处理
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const familyId = formData.get('familyId');
    const folderId = formData.get('folderId');
    const userId = formData.get('userId');
    const description = formData.get('description');
    const file = formData.get('file') as File;

    if (!familyId || !userId || !file) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents', String(familyId));
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${timestamp}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // 获取文件类型
    const mimeType = file.type || 'application/octet-stream';

    // 保存到数据库
    const result = db.prepare(`
      INSERT INTO plugin_document_files
      (family_id, folder_id, name, original_name, file_type, file_size, file_path, description, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(familyId),
      folderId ? Number(folderId) : null,
      fileName,
      file.name,
      mimeType,
      file.size,
      filePath,
      description?.toString() || null,
      Number(userId)
    );

    return NextResponse.json({
      success: true,
      fileId: result.lastInsertRowid,
      fileName: file.name,
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
