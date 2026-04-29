import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const SALT_ROUNDS = 10;

// 简单的内存速率限制（生产环境应使用 Redis）
const registerAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 小时
const RATE_LIMIT_MAX = 5; // 每个 IP 最多 5 次注册

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = registerAttempts.get(ip);

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    registerAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// 定期清理过期记录（每10分钟）
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of registerAttempts.entries()) {
    if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
      registerAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // 速率限制
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: '註冊請求過於頻繁，請稍後再試' },
        { status: 429 }
      );
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: '請填寫姓名、郵箱和密碼' },
        { status: 400 }
      );
    }

    // 密碼強度要求
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: '密碼長度至少8位' },
        { status: 400 }
      );
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: '密碼必須包含字母和數字' },
        { status: 400 }
      );
    }

    // 郵箱格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '郵箱格式不正確' },
        { status: 400 }
      );
    }

    // 檢查郵箱是否已註冊
    const existingUser = db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).get(email) as { id: number } | undefined;

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '該郵箱已註冊' },
        { status: 400 }
      );
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 創建用戶
    const result = db.prepare(`
      INSERT INTO users (name, email, password, is_admin)
      VALUES (?, ?, ?, 0)
    `).run(name.trim(), email.trim().toLowerCase(), hashedPassword);

    const userId = result.lastInsertRowid as number;

    return NextResponse.json({ success: true, message: '註冊成功，請登錄', userId });
  } catch (error) {
    console.error('註冊失敗:', error);
    return NextResponse.json(
      { success: false, error: '註冊失敗，請重試' },
      { status: 500 }
    );
  }
}
