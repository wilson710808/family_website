import { db } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { generateUniqueUserReferralCode, getFamilyByReferralCode } from './referral';

const JWT_SECRET = process.env.JWT_SECRET || 'family-website-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string;
  is_admin: number;
  created_at: string;
}

export interface Family {
  id: number;
  name: string;
  description: string;
  avatar: string;
  creator_id: number;
  referral_code: string;
  created_at: string;
  role?: string;
  status?: string;
}

// 用户注册
export async function registerUser(email: string, password: string, name: string, avatar?: string, referralCode?: string) {
  try {
    // 检查邮箱是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return { success: false, error: '邮箱已被注册' };
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 生成用户推荐码
    const userReferralCode = await generateUniqueUserReferralCode();

    // 创建用户
    const result = db.prepare('INSERT INTO users (email, password, name, avatar, referral_code) VALUES (?, ?, ?, ?, ?)').run(
      email,
      hashedPassword,
      name,
      avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      userReferralCode
    );

    const userId = result.lastInsertRowid as number;

    // 如果有推荐码，尝试加入对应的家族
    if (referralCode && referralCode.trim()) {
      const family = await getFamilyByReferralCode(referralCode.trim());
      if (family) {
        // 添加到家族，待审核状态
        db.prepare(`
          INSERT INTO family_members (family_id, user_id, status, invited_by)
          VALUES (?, ?, 'pending', ?)
        `).run(family.id, userId, family.creator_id);
      }
    }

    const user = db.prepare('SELECT id, email, name, avatar, is_admin, referral_code, created_at FROM users WHERE id = ?').get(userId) as User;

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
    const user = db.prepare('SELECT id, email, password, name, avatar, is_admin, created_at FROM users WHERE email = ?').get(email) as { id: number; email: string; password: string; name: string; avatar: string; is_admin: number; created_at: string };
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
    const user = db.prepare('SELECT id, email, name, avatar, is_admin, created_at FROM users WHERE id = ?').get(decoded.userId) as User;

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

// 初始化默认用户
export async function initDefaultUser() {
  try {
    // 只在服务器启动时执行，避免构建阶段执行
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production' || process.env.INIT_DB === 'true') {
      const defaultAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@family.com');
      if (!defaultAdmin) {
        const hashedPassword = bcrypt.hashSync('admin123456', 10);
        db.prepare('INSERT INTO users (email, password, name, is_admin) VALUES (?, ?, ?, 1)').run(
          'admin@family.com',
          hashedPassword,
          '系统管理员'
        );
        console.log('默认管理员账号创建成功：admin@family.com / admin123456');
      } else {
        // 升级现有 admin 用户为超级管理员
        db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run('admin@family.com');
      }
    }
  } catch (error) {
    console.error('初始化默认用户失败:', error);
  }
}

// 应用启动时初始化默认用户（仅在开发环境或显式指定时执行）
if (process.env.NODE_ENV !== 'production') {
  initDefaultUser();
}
