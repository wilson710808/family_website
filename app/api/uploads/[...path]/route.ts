/**
 * 靜態文件服務 API
 * 用於提供上傳的照片等媒體文件
 */
import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// 支持的 MIME 類型
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    
    // 安全檢查：防止路徑遍歷攻擊
    const safePath = pathSegments
      .map(segment => segment.replace(/\.\./g, '')) // 移除 ../
      .join('/');
    
    const filePath = path.join(UPLOAD_DIR, safePath);
    
    // 確保文件路徑在允許的目錄內
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: '無效的路徑' }, { status: 400 });
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 讀取文件
    const fileBuffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // 獲取文件信息用於緩存頭
    const fileStat = await stat(filePath);
    const lastModified = fileStat.mtime.toUTCString();

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 緩存一年
        'Last-Modified': lastModified,
      },
    });
  } catch (error) {
    console.error('[Upload API] 讀取文件失敗:', error);
    return NextResponse.json({ error: '讀取文件失敗' }, { status: 500 });
  }
}
