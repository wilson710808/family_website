/**
 * 靜態文件服務 API
 * 用於提供上傳的照片等靜態資源
 */
import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// 支持的文件類型
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
 const { path: pathParts } = await params;

 if (!pathParts || pathParts.length === 0) {
 return NextResponse.json({ error: '缺少文件路徑' }, { status: 400 });
 }

 // 構建文件路徑
 const filePath = path.join(UPLOAD_DIR, ...pathParts);

 // 安全檢查：防止路徑遍歷攻擊
 const normalizedPath = path.normalize(filePath);
 if (!normalizedPath.startsWith(UPLOAD_DIR)) {
 return NextResponse.json({ error: '無效路徑' }, { status: 403 });
 }

 // 檢查文件是否存在
 if (!existsSync(normalizedPath)) {
 return NextResponse.json({ error: '文件不存在' }, { status: 404 });
 }

 // 獲取文件擴展名
 const ext = path.extname(normalizedPath).toLowerCase();
 const mimeType = MIME_TYPES[ext];

 if (!mimeType) {
 return NextResponse.json({ error: '不支持的文件類型' }, { status: 400 });
 }

 // 讀取文件
 const fileBuffer = await readFile(normalizedPath);
 const fileStat = await stat(normalizedPath);

 // 返回文件
 return new NextResponse(fileBuffer, {
 headers: {
 'Content-Type': mimeType,
 'Content-Length': String(fileStat.size),
 'Cache-Control': 'public, max-age=31536000, immutable',
 'Last-Modified': fileStat.mtime.toUTCString(),
 },
 });
 } catch (error) {
 console.error('[Static File API] Error:', error);
 return NextResponse.json({ error: '文件讀取失敗' }, { status: 500 });
 }
}
