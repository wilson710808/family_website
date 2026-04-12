/**
 * 家族相冊插件 - 照片上傳 API
 * 支持多文件上傳、自動縮略圖生成
 */
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isEnabled, addPhoto } from '@/plugins/family-album';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// 上傳目錄配置
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'album');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const albumId = Number(formData.get('albumId'));
    const familyId = Number(formData.get('familyId'));

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '請選擇要上傳的照片' }, { status: 400 });
    }

    if (!albumId || !familyId) {
      return NextResponse.json({ error: '缺少相冊或家族信息' }, { status: 400 });
    }

    // 確保上傳目錄存在
    const albumDir = path.join(UPLOAD_DIR, String(familyId), String(albumId));
    if (!existsSync(albumDir)) {
      await mkdir(albumDir, { recursive: true });
    }

    const uploadedPhotos: Array<{ id: number; file_path: string; file_name: string }> = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (const file of files) {
      try {
        // 驗證文件類型
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push({ file: file.name, error: '不支持的文件類型' });
          continue;
        }

        // 驗證文件大小
        if (file.size > MAX_FILE_SIZE) {
          errors.push({ file: file.name, error: '文件大小超過 10MB 限制' });
          continue;
        }

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${timestamp}_${randomSuffix}.${ext}`;
        const filePath = path.join(albumDir, fileName);

        // 保存文件
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // 構建相對 URL 路徑（用於前端訪問）
        const relativePath = `/uploads/album/${familyId}/${albumId}/${fileName}`;

        // 寫入數據庫
        const photoId = addPhoto({
          album_id: albumId,
          family_id: familyId,
          file_path: relativePath,
          file_name: file.name,
          file_size: file.size,
          width: null,
          height: null,
          title: file.name.replace(/\.[^/.]+$/, ''), // 移除擴展名作為標題
          description: null,
          tags: null,
          uploaded_by: user.id,
          taken_at: null
        });

        uploadedPhotos.push({
          id: photoId,
          file_path: relativePath,
          file_name: file.name
        });
      } catch (fileError) {
        console.error(`[Album Upload] 處理文件 ${file.name} 失敗:`, fileError);
        errors.push({ file: file.name, error: String(fileError) });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: files.length,
        success: uploadedPhotos.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('[Album Upload API] POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
