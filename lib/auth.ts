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

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET environment variable is not set. Using insecure default for build/dev.');
}
const _jwtSecret = JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-prod';

// 在實際請求時檢查（避免 build 時報錯）
export function ensureJwtSecret(): string {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  return _jwtSecret;
}
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
 * 如果没有 token 或 token 无效，返回 null
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    // 如果没有 token，返回 null（表示未登录）
    if (!token) {
      return null;
    }
    
    // 验证 JWT token
    try {
      const decoded = jwt.verify(token.value, ensureJwtSecret()) as { userId: number };
      const userId = decoded.userId;
      
      // 从数据库获取用户信息
      const user = db.prepare(
        'SELECT id, email, name, avatar, is_admin, created_at, login_total, login_30d, last_login FROM users WHERE id = ?'
      ).get(userId) as User;
      
      if (user) {
        return user;
      }
    } catch (jwtError) {
      // token 无效或过期，清除无效 cookie 并返回 null
      console.error('JWT 验证失败:', jwtError);
      try {
        const { cookies: delCookies } = await import('next/headers');
        const delStore = await delCookies();
        delStore.set('auth-token', '', { maxAge: 0, path: '/' });
      } catch {}
      return null;
    }
    
    // 如果找不到用户，返回 null
    return null;
  } catch {
    return null;
  }
}

/**
 * 验证用户是否为家族成员
 */
export async function isUserInFamily(userId: number, familyId: number): Promise<boolean> {
  const member = db.prepare(`
    SELECT id FROM family_members
    WHERE family_id = ? AND user_id = ? AND status = 'approved'
  `).get(familyId, userId);
  return !!member;
}

/**
 * 返回用户所属的家族
 * 只有 approved 状态的成员才能看到家族
 */
export async function getUserFamilies(userId: number): Promise<Family[]> {
  const families = db.prepare(`
    SELECT f.*, fm.role, fm.status, fm.relationship, fm.contribution_points, fm.contribution_stars
    FROM families f
    INNER JOIN family_members fm ON f.id = fm.family_id
    WHERE fm.user_id = ? AND fm.status = 'approved'
    ORDER BY f.created_at DESC
  `).all(userId) as Family[];
  
  return families;
}

/**
 * 初始化默认管理员
 */
export async function initDefaultUser() {
  try {
    const bcrypt = require('bcryptjs');
    const defaultAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@family.com');
    if (!defaultAdmin) {
      const hashedPassword = bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456', 10);
      db.prepare(
        'INSERT INTO users (email, password, name, is_admin) VALUES (?, ?, ?, 1)'
      ).run('admin@family.com', hashedPassword, '系统管理员');
      console.log('默认管理员账号创建成功');
 if (!process.env.DEFAULT_ADMIN_PASSWORD) {
 console.warn('⚠️  使用默认管理员密码，请在生产环境设置 DEFAULT_ADMIN_PASSWORD 环境变量');
 }
    }
  } catch (error) {
    console.error('初始化默认用户失败:', error);
  }
}

// 开发环境初始化默认用户
if (process.env.NODE_ENV !== 'production') {
  initDefaultUser();
} else if (process.env.NODE_ENV === 'production') {
  // 生產環境安全檢查：如果默認管理員使用預設密碼，發出警告
  if (!process.env.DEFAULT_ADMIN_PASSWORD) {
    console.error('🔒 [安全警告] 生產環境未設置 DEFAULT_ADMIN_PASSWORD，請立即設置！');
  }
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
