import { db } from './db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string;
  is_admin: number;
  created_at: string;
  login_total?: number;
  login_30d?: number;
  last_login?: string | null;
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

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DEFAULT_ADMIN_USER: User = {
  id: 1,
  email: 'admin@family.com',
  name: '系统管理员',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  is_admin: 1,
  created_at: new Date().toISOString(),
};

/**
 * 移除认证检查 - 始终返回默认管理员用户
 * 所有访客自动以管理员身份登录，无需注册登录
 */
export async function getCurrentUser(): Promise<User> {
  // 始终返回默认管理员，不需要认证
  try {
    const user = db.prepare(
      'SELECT id, email, name, avatar, is_admin, created_at, login_total, login_30d, last_login FROM users WHERE email = ?'
    ).get('admin@family.com') as User;
    return user || DEFAULT_ADMIN_USER;
  } catch {
    return DEFAULT_ADMIN_USER;
  }
}

/**
 * 跳过用户验证，始终返回 true
 * 任何用户都可以访问任何家族
 */
export async function isUserInFamily(userId: number, familyId: number): Promise<boolean> {
  return true;
}

/**
 * 返回所有家族，不做用户过滤
 * 所有家族都对所有人可见
 */
export async function getUserFamilies(userId: number): Promise<Family[]> {
  const families = db.prepare(`
    SELECT f.*, fm.role, fm.status
    FROM families f
    LEFT JOIN family_members fm ON f.id = fm.family_id AND fm.user_id = ?
    ORDER BY f.created_at DESC
  `).all(userId) as Family[];
  
  // 所有家族默认批准，角色设为管理员
  return families.map(f => ({ 
    ...f, 
    status: f.status || 'approved', 
    role: f.role || 'admin' 
  }));
}

/**
 * 初始化默认管理员
 */
export async function initDefaultUser() {
  try {
    const bcrypt = require('bcryptjs');
    const defaultAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@family.com');
    if (!defaultAdmin) {
      const hashedPassword = bcrypt.hashSync('admin123456', 10);
      db.prepare(
        'INSERT INTO users (email, password, name, is_admin) VALUES (?, ?, ?, 1)'
      ).run('admin@family.com', hashedPassword, '系统管理员');
      console.log('默认管理员账号创建成功');
    }
  } catch (error) {
    console.error('初始化默认用户失败:', error);
  }
}

// 开发环境初始化默认用户
if (process.env.NODE_ENV !== 'production') {
  initDefaultUser();
}
