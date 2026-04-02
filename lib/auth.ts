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
  relationship?: string; // 家族关系称谓
  contribution_points?: number; // 贡献积分
  contribution_stars?: number; // 贡献星级 (1-5)
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
 * 从 cookie 中读取 JWT token，获取当前登录用户
 * 如果没有 token 或 token 无效，返回默认管理员用户（向后兼容）
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    // 如果没有 token，返回默认管理员（访客模式）
    if (!token) {
      const user = db.prepare(
        'SELECT id, email, name, avatar, is_admin, created_at, login_total, login_30d, last_login FROM users WHERE email = ?'
      ).get('admin@family.com') as User;
      return user || DEFAULT_ADMIN_USER;
    }
    
    // 验证 JWT token
    try {
      const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };
      const userId = decoded.userId;
      
      // 从数据库获取用户信息
      const user = db.prepare(
        'SELECT id, email, name, avatar, is_admin, created_at, login_total, login_30d, last_login FROM users WHERE id = ?'
      ).get(userId) as User;
      
      if (user) {
        return user;
      }
    } catch (jwtError) {
      // token 无效或过期，回退到默认管理员
      console.error('JWT 验证失败:', jwtError);
    }
    
    // 如果找不到用户，返回默认管理员
    const defaultUser = db.prepare(
      'SELECT id, email, name, avatar, is_admin, created_at, login_total, login_30d, last_login FROM users WHERE email = ?'
    ).get('admin@family.com') as User;
    return defaultUser || DEFAULT_ADMIN_USER;
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

/**
 * 计算贡献星级
 * 星级规则：
 * 1⭐ = 新成员 0-99 积分
 * 2⭐ = 创建者/活跃成员 100-299 积分
 * 3⭐ = 核心成员 300-599 积分  
 * 4⭐ = 资深成员 600-999 积分
 * 5⭐ = 顶流贡献 1000+ 积分
 */
export function calculateStars(points: number): number {
  if (points >= 1000) return 5;
  if (points >= 600) return 4;
  if (points >= 300) return 3;
  if (points >= 100) return 2;
  return 1;
}

/**
 * 添加贡献积分并自动更新星级
 */
export function addContributionPoints(familyId: number, userId: number, pointsToAdd: number) {
  const member = db.prepare(`
    SELECT contribution_points, contribution_stars 
    FROM family_members 
    WHERE family_id = ? AND user_id = ?
  `).get(familyId, userId) as { contribution_points: number, contribution_stars: number };
  
  if (!member) return;
  
  const newPoints = (member.contribution_points || 0) + pointsToAdd;
  const newStars = calculateStars(newPoints);
  
  db.prepare(`
    UPDATE family_members 
    SET contribution_points = ?, contribution_stars = ?
    WHERE family_id = ? AND user_id = ?
  `).run(newPoints, newStars, familyId, userId);
}

/**
 * 获取用户在家族中的关系和贡献信息
 */
export function getMemberInfo(familyId: number, userId: number) {
  return db.prepare(`
    SELECT relationship, contribution_points, contribution_stars
    FROM family_members
    WHERE family_id = ? AND user_id = ?
  `).get(familyId, userId) as {
    relationship: string | null;
    contribution_points: number | null;
    contribution_stars: number | null;
  };
}
