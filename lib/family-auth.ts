import { db } from './db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 验证用户是否为家族成员
 * 如果用户未登录或不是成员，返回 false
 */
export async function isFamilyMember(familyId: number, userId?: number): Promise<boolean> {
  // 如果未指定 userId，尝试从 cookie 获取
  if (!userId) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token');
      if (!token) {
        return false; // 未登录
      }
      const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      return false; // token 无效
    }
  }

  // 检查用户是否是家族成员（approved 状态）
  const member = db.prepare(`
    SELECT id FROM family_members
    WHERE family_id = ? AND user_id = ? AND status = 'approved'
  `).get(familyId, userId);

  return !!member;
}

/**
 * 验证用户是否为家族管理员
 */
export async function isFamilyAdmin(familyId: number, userId?: number): Promise<boolean> {
  if (!userId) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token');
      if (!token) return false;
      const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      return false;
    }
  }

  const member = db.prepare(`
    SELECT id FROM family_members
    WHERE family_id = ? AND user_id = ? AND status = 'approved' AND role = 'admin'
  `).get(familyId, userId);

  return !!member;
}

/**
 * 获取用户ID（从 cookie 或 null）
 */
export async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    if (!token) return null;
    
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

export default {
  isFamilyMember,
  isFamilyAdmin,
  getCurrentUserId,
};
