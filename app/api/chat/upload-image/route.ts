/**
 * 聊天室图片上传 API
 * 支持图片上传并返回可访问的 URL
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import db from '@/lib/db';
import { getCurrentUser, addContributionPoints } from '@/lib/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'chat');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ChatMessage {
  id: number;
  family_id: number;
  user_id: number;
  content: string;
  created_at: string;
  message_type: string;
  user_name: string;
  user_avatar: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const familyId = Number(formData.get('familyId'));

    if (!file) {
      return NextResponse.json({ success: false, error: '請選擇圖片' }, { status: 400 });
    }

    if (!familyId) {
      return NextResponse.json({ success: false, error: '缺少家族信息' }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: '不支援的圖片格式，僅支持 JPG、PNG、GIF、WebP' }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: '圖片大小不能超過 5MB' }, { status: 400 });
    }

    // 确保上传目录存在
    const familyDir = path.join(UPLOAD_DIR, String(familyId));
    if (!existsSync(familyDir)) {
      await mkdir(familyDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomSuffix}.${ext}`;
    const filePath = path.join(familyDir, fileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 构建相对 URL 路径
    const imageUrl = `/uploads/chat/${familyId}/${fileName}`;

    // 保存到数据库
    const result = db.prepare(`
      INSERT INTO chat_messages (family_id, user_id, content, message_type, metadata)
      VALUES (?, ?, ?, 'image', ?)
    `).run(familyId, user.id, imageUrl, JSON.stringify({ originalName: file.name, size: file.size, type: file.type }));

    // 添加贡献积分：发送图片 +3 积分
    addContributionPoints(familyId, user.id, 3);

    // 获取插入的消息
    const message = db.prepare(`
      SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at, cm.message_type, u.name as user_name, u.avatar as user_avatar
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid as number) as ChatMessage | undefined;

    if (!message) {
      return NextResponse.json({ success: false, error: '消息保存失敗' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: { ...message, message_type: 'image' }
    });
  } catch (error) {
    console.error('[Chat Upload] 上傳失敗:', error);
    return NextResponse.json({ success: false, error: '上傳失敗，請重試' }, { status: 500 });
  }
}
