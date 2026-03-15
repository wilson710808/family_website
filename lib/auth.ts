import { db } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'family-website-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string;
  created_at: string;
}

export interface Family {
  id: number;
  name: string;
  description: string;
  avatar: string;
  creator_id: number;
  created_at: string;
  role?: string;
  status?: string;
}

// 用户注册
export async function registerUser(email: string, password: string, name: string) {
  try {
    // 检查邮箱是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return { success: false, error: '邮箱已被注册' };
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 创建用户
    const result = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(
      email,
      hashedPassword,
      name
    );

    const user = db.prepare('SELECT id, email, name, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid) as User;

    // 生成JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return { success: true, user, token };
  } catch (error) {
    console.error('注册失败:', error);
    return { success: false, error: '注册失败，请重试' };
  }
}

// 用户登录
export async function loginUser(email: string, password: string) {
  try {
    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as { id: number; email: string; password: string; name: string; avatar: string; created_at: string };
    if (!user) {
      return { success: false, error: '邮箱或密码错误' };
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: '邮箱或密码错误' };
    }

    // 生成JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 返回用户信息（排除密码）
    const { password: _, ...userWithoutPassword } = user;

    return { success: true, user: userWithoutPassword, token };
  } catch (error) {
    console.error('登录失败:', error);
    return { success: false, error: '登录失败，请重试' };
  }
}

// 验证token获取当前用户
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    const user = db.prepare('SELECT id, email, name, avatar, created_at FROM users WHERE id = ?').get(decoded.userId) as User;

    return user || null;
  } catch (error) {
    return null;
  }
}

// 验证用户是否属于某个家族
export async function isUserInFamily(userId: number, familyId: number): Promise<boolean> {
  try {
    const member = db.prepare('SELECT id FROM family_members WHERE user_id = ? AND family_id = ? AND status = ?').get(userId, familyId, 'approved');
    return !!member;
  } catch (error) {
    return false;
  }
}

// 获取用户的家族列表
export async function getUserFamilies(userId: number): Promise<Family[]> {
  try {
    const families = db.prepare(`
      SELECT f.*, fm.role, fm.status
      FROM families f
      JOIN family_members fm ON f.id = fm.family_id
      WHERE fm.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId) as Family[];
    return families;
  } catch (error) {
    console.error('获取家族列表失败:', error);
    return [];
  }
}
